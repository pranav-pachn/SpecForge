import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/ai/gateway/gateway";
import { PromptRegistry } from "@/ai/prompts/registry";
import { WorkflowStatus } from "@prisma/client";
import { planQuestionMerge } from "@/workflow/clarifications/mergeQuestions";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, specContent, versionId } = await req.json();

    if (!workflowId || !specContent || !versionId) {
      return apiError("workflowId, specContent, and versionId are required", 400);
    }

    // Call LLM for clarification questions
    const { text } = await gateway.execute({
      capability: "clarify",
      system: await PromptRegistry.clarify(),
      prompt: `Analyze this specification and generate clarification questions:\n\n${specContent}`,
    });

    let result: any = {};
    try {
      // Find JSON object in the response
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return apiError("AI generated invalid response format", 500);
    }

    const questions = result.questions || [];
    const ambiguityScore = typeof result.ambiguityScore === "number" ? result.ambiguityScore : 0;

    // Save to database. ambiguityScore is returned to the client; ArtifactVersion has no column for it.
    const savedQuestions = await db.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: WorkflowStatus.CLARIFYING },
      });

      const existing = await tx.clarificationQuestion.findMany({ where: { versionId } });
      const merge = planQuestionMerge(existing, questions);
      if (merge.deleteIds.length > 0) {
        await tx.clarificationQuestion.deleteMany({ where: { id: { in: merge.deleteIds } } });
      }

      const created = [];
      for (const q of merge.create) {
        const createdQ = await tx.clarificationQuestion.create({
          data: {
            versionId,
            category: q.kind || q.category || "General",
            question: q.question,
            options: q.options || [],
            rationale: q.rationale || "",
            impact: q.impact || {},
            status: "OPEN",
          },
        });
        created.push(createdQ);
      }
      const kept = existing.filter((q) => merge.keepIds.includes(q.id));
      return [...kept, ...created];
    });

    return jsonResponse({ questions: savedQuestions, ambiguityScore }, 201);
  } catch (error) {
    console.error("Clarification error:", error);
    return apiError("Failed to generate clarifications", 500);
  }
}
