import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { aiConfig, generateTextWithGemini, MODEL_IDS } from "@/lib/ai/config";
import { TASK_DECOMPOSITION_SYSTEM_PROMPT } from "@/lib/ai/task-prompts";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, planContent, planVersionId } = await req.json();

    if (!workflowId || !planContent || !planVersionId) {
      return apiError("workflowId, planContent, and planVersionId are required", 400);
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const prompt = `Please decompose the following Implementation Plan into tasks:\n\n### Implementation Plan\n${planContent}`;

    const { text } = await generateTextWithGemini(MODEL_IDS.FLASH, {
      system: TASK_DECOMPOSITION_SYSTEM_PROMPT,
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

      const tasks = [];
      for (const t of result.tasks) {
        const created = await tx.task.create({
          data: {
            workflowId,
            versionId: planVersionId, // Tasks are generated from the Plan version
            title: t.title,
            description: t.description,
            acceptanceCriteria: t.acceptanceCriteria,
            verificationNotes: t.verificationNotes,
            priority: t.priority || 2,
            order: t.order || 0,
            status: "TODO",
          },
        });
        tasks.push(created);
      }

      // We don't advance the workflow state here yet, 
      // the user will manually click "Continue to Execute" on the UI
      return tasks;
    });

    return jsonResponse({ success: true, tasks: createdTasks }, 201);
  } catch (error) {
    console.error("Task Decomposition Error:", error);
    return apiError("Failed to generate tasks", 500);
  }
}
