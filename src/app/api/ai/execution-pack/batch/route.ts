import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { EXECUTION_PACK_SYSTEM_PROMPT } from "@/lib/ai/execution-prompts";
import { ToolName } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, toolName, specContent, planContent } = await req.json();

    if (!workflowId || !toolName || !specContent) {
      return apiError("workflowId, toolName, and specContent are required", 400);
    }

    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
      include: { tasks: { orderBy: { order: "asc" } } }
    });

    if (!workflow) return apiError("Workflow not found", 404);

    const toolProfile = await db.toolProfile.findUnique({
      where: { name: toolName }
    });

    let configStr = "";
    if (toolProfile) {
      try {
        const parsed = JSON.parse(toolProfile.config);
        configStr = parsed.promptTemplate || "";
      } catch (e) {}
    }

    const packs = [];

    // Note: Generating sequentially to avoid rate limits, but in a real app might use Promise.all or background jobs.
    for (const task of workflow.tasks) {
      const prompt = `
Task to execute:
Title: ${task.title}
Description: ${task.description || "None"}
Acceptance Criteria: ${task.acceptanceCriteria || "None"}

### Full Feature Specification (for context)
${specContent}

### Implementation Plan (for context)
${planContent || "None provided."}

### Tool Formatting Preferences (${toolName})
${configStr || "No specific formatting required. Use clear markdown."}

Generate the optimal prompt/execution pack for this tool to implement this task.
`;

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: EXECUTION_PACK_SYSTEM_PROMPT,
        prompt,
      });

      let pack = await db.executionPack.findFirst({
        where: { taskId: task.id, toolName: toolName as ToolName }
      });

      if (pack) {
        pack = await db.executionPack.update({
          where: { id: pack.id },
          data: { content: text }
        });
      } else {
        pack = await db.executionPack.create({
          data: {
            versionId: task.versionId,
            taskId: task.id,
            toolName: toolName as ToolName,
            content: text
          }
        });
      }
      packs.push(pack);
    }

    // Advance workflow state if we haven't already
    if (workflow.status === "TASK_BREAKDOWN") {
      await db.workflow.update({
        where: { id: workflowId },
        data: { status: "EXECUTING" }
      });
    }

    return jsonResponse({ success: true, packs }, 201);
  } catch (error) {
    console.error("Batch Execution Pack Error:", error);
    return apiError("Failed to generate execution packs", 500);
  }
}
