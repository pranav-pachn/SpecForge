import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/gateway/gateway";
import { PromptRegistry } from "@/lib/ai/prompts/registry";
import { ToolName } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; issueId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const issue = await db.validationIssue.findUnique({
      where: { id: params.issueId, reportId: params.id },
      include: {
        report: {
          include: {
            workflow: {
              include: {
                artifacts: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } }
              }
            }
          }
        }
      }
    });

    if (!issue) return apiError("Issue not found", 404);
    if (issue.taskId) return apiError("Fix already generated", 400);

    const workflow = issue.report.workflow;
    const specContent = workflow.artifacts.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content || "";
    const planContent = workflow.artifacts.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content || "";
    
    // Find highest order to put this task at the end
    const lastTask = await db.task.findFirst({
      where: { workflowId: workflow.id },
      orderBy: { order: "desc" }
    });
    const nextOrder = (lastTask?.order ?? -1) + 1;

    const prompt = `
### 1. Specification
${specContent}

### 2. Implementation Plan
${planContent}

### 3. Validation Issue
Title: ${issue.title}
Category: ${issue.category}
Severity: ${issue.severity}
Description: ${issue.description}
Recommendation: ${issue.recommendation || 'None'}
`;

    const { text } = await gateway.execute({
      capability: "auto_fix",
      system: PromptRegistry.autoFix(),
      prompt,
      });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

    const taskData = result.task;
    const executionPackData = result.executionPack;

    // Save fix
    const task = await db.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: {
          workflowId: workflow.id,
          versionId: issue.report.versionId,
          title: taskData.title || `Fix ${issue.title}`,
          description: taskData.description || issue.description,
          acceptanceCriteria: taskData.acceptanceCriteria,
          complexity: taskData.complexity,
          requirements: taskData.requirements || [],
          order: nextOrder,
        }
      });

      // generate execution packs for each tool based on the payload
      const tools: ToolName[] = ["CURSOR", "CLAUDE_CODE", "WINDSURF"];
      for (const tool of tools) {
        await tx.executionPack.create({
          data: {
            taskId: newTask.id,
            versionId: issue.report.versionId,
            toolName: tool,
            content: JSON.stringify(executionPackData)
          }
        });
      }

      await tx.validationIssue.update({
        where: { id: issue.id },
        data: { taskId: newTask.id }
      });

      return newTask;
    });

    return jsonResponse({ success: true, task }, 201);
  } catch (error) {
    console.error("Generate Fix Error:", error);
    return apiError("Failed to generate fix", 500);
  }
}
