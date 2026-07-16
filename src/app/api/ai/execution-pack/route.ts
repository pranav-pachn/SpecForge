import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";
import { ToolName } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { taskId, toolName, specContent, planContent } = await req.json();

    if (!taskId || !toolName || !specContent) {
      return apiError("taskId, toolName, and specContent are required", 400);
    }

    // Verify task belongs to user
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { workflow: true, version: true }
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    // Get tool profile
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

    const { text } = await gateway.execute({
      capability: "spec",
      system: PromptRegistry.spec(),
      prompt,
    });

    let packContent = text;
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        // validate JSON
        JSON.parse(jsonStr);
        packContent = jsonStr;
      }
    } catch (e) {
      console.warn("Could not parse AI response as JSON", e);
    }

    // Determine the version this pack belongs to (we use the plan's version)
    // Actually, ExecutionPacks are generated from tasks which belong to a versionId (the Plan's version).
    
    // Check if an ExecutionPack already exists for this task and tool
    let pack = await db.executionPack.findFirst({
      where: { taskId: task.id, toolName: toolName as ToolName }
    });

    if (pack) {
      pack = await db.executionPack.update({
        where: { id: pack.id },
        data: { content: packContent }
      });
    } else {
      pack = await db.executionPack.create({
        data: {
          versionId: task.versionId,
          taskId: task.id,
          toolName: toolName as ToolName,
          content: packContent
        }
      });
    }

    // Advance workflow state if we haven't already
    if (task.workflow.status === "TASK_BREAKDOWN") {
      await db.workflow.update({
        where: { id: task.workflowId },
        data: { status: "EXECUTING" }
      });
    }

    return jsonResponse(pack, 201);
  } catch (error) {
    console.error("Execution Pack Error:", error);
    return apiError("Failed to generate execution pack", 500);
  }
}
