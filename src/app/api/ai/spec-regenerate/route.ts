import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { aiConfig, generateTextWithGemini, MODEL_IDS } from "@/lib/ai/config";
import { SPEC_REGENERATE_SYSTEM_PROMPT } from "@/lib/ai/spec-regenerate-prompts";

export const maxDuration = 60; // 60 seconds max duration for Vercel

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, versionId, specContent, clarifications } = await req.json();

    if (!workflowId || !versionId || !specContent || !clarifications) {
      return apiError("workflowId, versionId, specContent, and clarifications are required");
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    // Build the user prompt
    let userPrompt = `### Original Specification\n\n${specContent}\n\n### Clarifications\n\n`;
    clarifications.forEach((c: any) => {
      userPrompt += `**Question (${c.category || "General"}):** ${c.question}\n**Answer:** ${c.answer}\n\n`;
    });
    userPrompt += `\nPlease rewrite the specification to incorporate the answers above into the appropriate sections.`;

    // Call the LLM
    const { text } = await generateTextWithGemini(MODEL_IDS.PRO, {
      temperature: aiConfig.temperature,
      system: SPEC_REGENERATE_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    // We will save this as a new version of the spec artifact.
    // So we first find the artifactId from the current version.
    const currentVersion = await db.artifactVersion.findUnique({
      where: { id: versionId },
    });
    
    if (!currentVersion) return apiError("Current version not found", 404);
    const artifactId = currentVersion.artifactId;

    // Determine the next version number
    const latestVersion = await db.artifactVersion.findFirst({
      where: { artifactId },
      orderBy: { version: "desc" },
    });
    const newVersionNum = latestVersion ? latestVersion.version + 1 : 2;

    const newVersion = await db.$transaction(async (tx) => {
      // Mark old version as superseded
      if (latestVersion) {
        await tx.artifactVersion.update({
          where: { id: latestVersion.id },
          data: { status: "SUPERSEDED" },
        });
      }

      // Create new version
      const created = await tx.artifactVersion.create({
        data: {
          artifactId: artifactId,
          version: newVersionNum,
          content: text,
          status: "DRAFT", // Put it in DRAFT state so user can review the regenerated spec
        },
      });

      // Workflow goes back to DRAFT or SPEC_REVIEW depending on how we handle it.
      // Let's set it to SPEC_REVIEW so it stays in the review cycle but user can edit it.
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: "SPEC_REVIEW" },
      });

      return created;
    });

    // Run drift engine after transaction
    if (latestVersion) {
      const { handleArtifactDrift } = await import("@/server/services/drift-engine");
      await handleArtifactDrift(workflowId, "SPEC", latestVersion.id, newVersion.id);
    }

    return jsonResponse(newVersion, 201);
  } catch (error) {
    console.error("Spec Regeneration Error:", error);
    return apiError("Failed to regenerate spec", 500);
  }
}
