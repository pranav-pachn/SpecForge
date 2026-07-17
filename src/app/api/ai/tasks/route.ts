import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, planContent, planVersionId } = await req.json();

    if (!workflowId || !planContent || !planVersionId) {
      return apiError("Plan content is missing or empty. Please go back to the Plan tab and regenerate the plan.", 400);
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const prompt = `Please decompose the following Implementation Plan into tasks:\n\n### Implementation Plan\n${planContent}`;

    const { text } = await gateway.execute({
      capability: "tasks",
      system: PromptRegistry.tasks(),
      prompt,
      });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

    if (!result.tasks || !Array.isArray(result.tasks)) {
      return apiError("AI generated response without tasks array", 500);
    }

    // Save tasks to DB
    const createdTasks = await db.$transaction(async (tx) => {
      // Clear old tasks for this workflow (if regenerating)
      await tx.task.deleteMany({ where: { workflowId } });

      const tasksMap = new Map(); // to store title -> task for dependency mapping
      const tasks = [];

      for (const t of result.tasks) {
        const created = await tx.task.create({
          data: {
            workflowId,
            versionId: planVersionId, // Tasks are generated from the Plan version
            title: t.title,
            description: t.description,
            acceptanceCriteria: Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria.map((c: any) => `- ${c}`).join('\n') : t.acceptanceCriteria,
            verificationNotes: Array.isArray(t.verificationNotes) ? t.verificationNotes.map((c: any) => `- ${c}`).join('\n') : t.verificationNotes,
            priority: t.priority || 2,
            order: t.order || 0,
            status: "TODO",
            complexity: t.complexity,
            requirements: t.requirements || [],
          },
        });
        tasksMap.set(t.title, created);
        tasks.push(created);
      }

      // Second pass: wire up dependencies
      for (const t of result.tasks) {
        if (t.dependencies && t.dependencies.length > 0) {
          const currentTask = tasksMap.get(t.title);
          for (const depTitle of t.dependencies) {
            const dependsOnTask = tasksMap.get(depTitle);
            if (currentTask && dependsOnTask) {
              await tx.taskDependency.create({
                data: {
                  taskId: currentTask.id,
                  dependsOnId: dependsOnTask.id,
                }
              });
            }
          }
        }
      }

      return tasks;
    });

    return jsonResponse({ success: true, tasks: createdTasks }, 201);
  } catch (error) {
    console.error("Task Decomposition Error:", error);
    return apiError("Failed to generate tasks", 500);
  }
}
