import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { db } from "@/lib/db";
import { aiConfig, generateTextWithGemini, MODEL_IDS } from "@/lib/ai/config";
import { SPEC_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { ArtifactVersionStatus, WorkflowStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { logEvent } from "@/lib/instrumentation";

export const maxDuration = 60; // 60 seconds max duration for Vercel

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { 
      workflowId, 
      versionId, 
      rawIdea, 
      audience, 
      goal, 
      outOfScope, 
      constraints, 
      targetTool 
    } = await req.json();

    if (!workflowId || !versionId || !rawIdea) {
      return apiError("workflowId, versionId, and rawIdea are required");
    }

    // Basic authorization
    const version = await db.artifactVersion.findUnique({
      where: { id: versionId },
      include: { artifact: { include: { workflow: true } } },
    });

    if (!version) return apiError("Artifact version not found", 404);
    if (version.artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    // Construct the user prompt from the hybrid intake fields
    const userPrompt = `
Here is the raw feature idea:
"""
${rawIdea}
"""

Additional Context (Structured Intake):
- Who is this for (Audience)?: ${audience || "Not specified"}
- Main outcome (Goal)?: ${goal || "Not specified"}
- Out of scope?: ${outOfScope || "Not specified"}
- Technical constraints?: ${constraints || "Not specified"}
- Target execution tool?: ${targetTool || "Not specified"}

Please generate the product-ready feature specification using the required 12-section template.
`;

    // Call the LLM
    const { text } = await generateTextWithGemini(MODEL_IDS.PRO, {
      temperature: aiConfig.temperature,
      system: SPEC_GENERATION_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    // Save the generated content to the database
    // We update the draft version content and set its status to NEEDS_REVIEW
    const updatedVersion = await db.artifactVersion.update({
      where: { id: versionId },
      data: {
        content: text,
        status: ArtifactVersionStatus.NEEDS_REVIEW,
      },
    });

    // Update the workflow status to SPEC_REVIEW
    await db.workflow.update({
      where: { id: workflowId },
      data: { status: WorkflowStatus.SPEC_REVIEW },
    });

    logEvent("SPEC_GENERATED", {
      workflowId,
      userId: user.id,
      metadata: { targetTool }
    });

    return jsonResponse(updatedVersion);
  } catch (error) {
    console.error("Spec Generation Error:", error);
    return apiError("Failed to generate spec", 500);
  }
}