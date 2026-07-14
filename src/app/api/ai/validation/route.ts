import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { aiConfig, generateTextWithGemini, MODEL_IDS } from "@/lib/ai/config";
import { VALIDATION_SYSTEM_PROMPT } from "@/lib/ai/validation-prompts";

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

    const specContent = workflow.artifacts.find(a => a.type === "SPEC")?.versions?.[0]?.content || "";
    const planContent = workflow.artifacts.find(a => a.type === "PLAN")?.versions?.[0]?.content || "";
    const specVersionId = workflow.artifacts.find(a => a.type === "SPEC")?.versions?.[0]?.id;
    const tasksData = JSON.stringify(workflow.tasks.map(t => ({
      title: t.title,
      description: t.description,
      acceptanceCriteria: t.acceptanceCriteria
    })));

    if (!specVersionId) return apiError("Spec version not found for validation binding", 400);

    const prompt = `
Please validate this artifact chain against the original spec:

### 1. Specification
${specContent}

### 2. Implementation Plan
${planContent}

### 3. Tasks
${tasksData}
`;

    const { text } = await generateTextWithGemini(MODEL_IDS.FLASH, {
      system: VALIDATION_SYSTEM_PROMPT,
      prompt,
    });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

    // Save checks
    const checks = await db.$transaction(async (tx) => {
      // Clear old validation checks for this spec version
      await tx.validationCheck.deleteMany({ 
        where: { versionId: specVersionId } 
      });

      const newChecks = [];
      for (const c of (result.checks || [])) {
        const created = await tx.validationCheck.create({
          data: {
            versionId: specVersionId,
            criteria: c.criteria,
            category: c.category,
            status: c.status === "PASSED" ? "PASSED" : "FAILED",
            resultNotes: c.resultNotes
          }
        });
        newChecks.push(created);
      }
      return newChecks;
    });

    return jsonResponse({ success: true, checks }, 201);
  } catch (error) {
    console.error("Validation Error:", error);
    return apiError("Failed to run validation", 500);
  }
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const versionId = searchParams.get("versionId");

  if (!versionId) return apiError("versionId is required", 400);

  try {
    const checks = await db.validationCheck.findMany({
      where: { versionId },
      orderBy: { createdAt: "desc" }
    });
    return jsonResponse(checks);
  } catch (error) {
    return apiError("Failed to fetch checks", 500);
  }
}
