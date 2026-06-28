import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { FULL_REVIEW_SYSTEM_PROMPT } from "@/lib/ai/review-prompts";
import { CheckStatus, ReviewCheckType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId } = await req.json();
    if (!workflowId) return apiError("workflowId is required", 400);

    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
      include: { 
        artifacts: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } },
        tasks: { orderBy: { order: "asc" } }
      }
    });

    if (!workflow) return apiError("Workflow not found", 404);

    const specContent = workflow.artifacts.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content || "";
    const planContent = workflow.artifacts.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content || "";
    const planVersionId = workflow.artifacts.find((a: any) => a.type === "PLAN")?.versions?.[0]?.id;
    const tasksData = JSON.stringify(workflow.tasks.map((t: any) => ({
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria
    })));

    const prompt = `
Please review this artifact chain:

### 1. Specification
${specContent}

### 2. Implementation Plan
${planContent}

### 3. Tasks
${tasksData}
`;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: FULL_REVIEW_SYSTEM_PROMPT,
      prompt,
    });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

    if (!planVersionId) return apiError("Plan version not found for review binding", 400);

    // Save findings
    const findings = await db.$transaction(async (tx) => {
      // Clear old FULL reviews for this plan version (if regenerating)
      // Since type is ReviewCheckType enum, we'll map category/severity into type/status
      await tx.reviewCheck.deleteMany({ 
        where: { versionId: planVersionId, type: "CONSISTENCY" } 
      });

      const checks = [];
      for (const f of (result.findings || [])) {
        // We reuse ReviewCheck model. 
        // We use type="CONSISTENCY" to represent these full-chain checks since it's about cross-artifact alignment.
        // We store the severity and category in the description field (which is String).
        const descriptionStr = `[${f.severity}] [${f.category}] [${f.affectedArtifact}] ${f.description}`;
        
        let status: CheckStatus = "PASSED";
        if (f.severity === "BLOCKER") status = "FAILED";
        else if (f.severity === "WARNING") status = "PENDING"; // Map WARNING to PENDING to differentiate, or just keep it as FAILED if we want to block, but we only want to block on BLOCKER. Actually schema only has PASSED, FAILED, PENDING. Let's use PENDING for WARNINGs.
        
        const created = await tx.reviewCheck.create({
          data: {
            versionId: planVersionId,
            type: "CONSISTENCY", 
            status,
            description: descriptionStr
          }
        });
        checks.push(created);
      }
      return checks;
    });

    return jsonResponse({ success: true, findings }, 201);
  } catch (error) {
    console.error("Full Review Error:", error);
    return apiError("Failed to run full review", 500);
  }
}