import { db } from "@/platform/storage/db";
import { ToolName } from "@prisma/client";
import { gateway } from "@/ai/gateway/gateway";
import { PromptRegistry } from "@/ai/prompts/registry";

export async function compileExecutionPack(taskId: string, toolName: ToolName, specContent: string, planContent: string): Promise<string> {
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { dependencies: true }
    });

    if (!task) throw new Error("Task not found");

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
${configStr || "No specific formatting required. Use clear markdown. Write the response directly as the prompt content."}

Generate the optimal prompt/execution pack for this tool to implement this task. Do not wrap in JSON.
`;

    const { text } = await gateway.execute({
      capability: "spec",
      system: await PromptRegistry.spec(),
      prompt,
    });

    let packContent = text;
    try {
      if (text.includes("{") && text.includes("}")) {
        const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        JSON.parse(jsonStr);
        packContent = jsonStr;
      }
    } catch (e) {
      console.warn("Could not parse AI response as JSON", e);
    }
    
    return packContent;
}