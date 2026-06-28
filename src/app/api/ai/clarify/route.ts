import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { CLARIFICATION_SYSTEM_PROMPT } from "@/lib/ai/clarification-prompts";
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
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: CLARIFICATION_SYSTEM_PROMPT,
      prompt: `Analyze this specification and generate clarification questions:\n\n${specContent}`,
    });

    let questions = [];
    try {
      // Find JSON array in the response
      const jsonStr = text.substring(text.indexOf("["), text.lastIndexOf("]") + 1);
      questions = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return apiError("AI generated invalid response format", 500);
    }

    // Save to database
    const savedQuestions = await db.$transaction(async (tx) => {
      // Update workflow status to CLARIFYING if not already
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: WorkflowStatus.CLARIFYING },
      });

      // Insert questions
      const created = [];
      for (const q of questions) {
        const createdQ = await tx.clarificationQuestion.create({
          data: {
            versionId,
            category: q.category,
            question: q.question,
            status: "OPEN",
          },
        });
        created.push(createdQ);
      }
      return created;
    });

    return jsonResponse(savedQuestions, 201);
  } catch (error) {
    console.error("Clarification error:", error);
    return apiError("Failed to generate clarifications", 500);
  }
}
