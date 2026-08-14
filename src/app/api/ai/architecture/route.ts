import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/ai/gateway/gateway";
import { PromptRegistry } from "@/ai/prompts/registry";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, planContent, planVersionId } = await req.json();

    if (!workflowId || !planContent || !planVersionId) {
      return apiError("workflowId, planContent, and planVersionId are required", 400);
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const prompt = `Extract the architecture from the following Implementation Plan:\n\n### Implementation Plan\n${planContent}`;

    const { text } = await gateway.execute({
      capability: "planning",
      system: await PromptRegistry.architecture(),
      prompt,
    });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

    // Create the ARCHITECTURE artifact
    const artifact = await db.$transaction(async (tx) => {
      let archArtifact = await tx.artifact.findFirst({
        where: { workflowId, type: "ARCHITECTURE" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });

      if (!archArtifact) {
        archArtifact = await tx.artifact.create({
          data: {
            workflowId,
            type: "ARCHITECTURE",
            title: "Architecture Map",
            versions: {
              create: {
                version: 1,
                content: JSON.stringify(result),
                status: "APPROVED",
              },
            },
          },
          include: { versions: true },
        });
      } else {
        const nextVersion = (archArtifact.versions[0]?.version || 0) + 1;
        await tx.artifactVersion.create({
          data: {
            artifactId: archArtifact.id,
            version: nextVersion,
            content: JSON.stringify(result),
            status: "APPROVED",
          },
        });
      }
      return archArtifact;
    });

    return jsonResponse({ success: true, artifactId: artifact.id, content: result }, 201);
  } catch (error) {
    console.error("Architecture Generation Error:", error);
    return apiError("Failed to generate architecture", 500);
  }
}
