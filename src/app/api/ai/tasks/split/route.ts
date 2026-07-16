import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, taskId, count } = await req.json();

    if (!workflowId || !taskId || !count) {
      return apiError("workflowId, taskId, and count are required", 400);
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { workflow: true }
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const prompt = `Please split the following task into exactly ${count} smaller, sequential sub-tasks. Replace the original task entirely.

### Original Task
Title: ${task.title}
Description: ${task.description}
Acceptance Criteria: ${task.acceptanceCriteria}

Return the ${count} new tasks in the same JSON format as requested in the system prompt. Make sure their orders follow sequentially after ${task.order}.`;

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

    const newTasks = await db.$transaction(async (tx) => {
      // Create the new tasks
      const created = [];
      let currentOrder = task.order;
      for (const t of result.tasks) {
        const newTask = await tx.task.create({
          data: {
            workflowId,
            versionId: task.versionId,
            title: t.title,
            description: t.description,
            acceptanceCriteria: t.acceptanceCriteria,
            verificationNotes: t.verificationNotes,
            priority: t.priority || task.priority || 2,
            order: currentOrder,
            status: "TODO",
            complexity: t.complexity,
            requirements: t.requirements || [],
          },
        });
        created.push(newTask);
        currentOrder++;
      }

      // Shift subsequent tasks down
      await tx.task.updateMany({
        where: {
          workflowId,
          order: { gt: task.order },
          id: { not: task.id }
        },
        data: {
          order: { increment: created.length - 1 }
        }
      });

      // Delete the original task
      await tx.task.delete({
        where: { id: task.id }
      });

      return created;
    });

    return jsonResponse({ success: true, tasks: newTasks }, 201);
  } catch (error) {
    console.error("Task Split Error:", error);
    return apiError("Failed to split task", 500);
  }
}
