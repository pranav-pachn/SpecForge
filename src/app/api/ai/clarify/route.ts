import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/ai/gateway/gateway";
import { PromptRegistry } from "@/ai/prompts/registry";
import { WorkflowStatus } from "@prisma/client";

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
    const ambiguityScore = result.ambiguityScore || 0;

    // Save to database
    const savedQuestions = await db.$transaction(async (tx) => {
      // Update workflow status to CLARIFYING if not already
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: WorkflowStatus.CLARIFYING },
      });

      // Update the artifact version with ambiguityScore
      await tx.artifactVersion.update({
        where: { id: versionId },
        data: { ambiguityScore }
      });

      // Clear any existing questions for this version to prevent duplicates on regenerate
      await tx.clarificationQuestion.deleteMany({
        where: { versionId },
      });

      // Insert questions
      const created = [];
      for (const q of questions) {
        const createdQ = await tx.clarificationQuestion.create({
          data: {
            versionId,
            category: q.category,
            question: q.question,
            options: q.options || [],
            rationale: q.rationale || "",
            impact: q.impact || {},
            status: "OPEN",
          },
        });
        created.push(createdQ);
      }
      return created;
    });

    return jsonResponse({ questions: savedQuestions, ambiguityScore }, 201);
  } catch (error) {
    console.error("Clarification error:", error);
    return apiError("Failed to generate clarifications", 500);
  }
}
