import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { PLAN_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/plan-prompts";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, specContent, clarifications } = await req.json();

    if (!workflowId || !specContent) {
      return apiError("workflowId and specContent are required", 400);
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    let prompt = `Please generate an Implementation Plan for the following specification:\n\n### Specification\n${specContent}\n\n`;
    
    if (clarifications && clarifications.length > 0) {
      prompt += `### Clarifications\n`;
      clarifications.forEach((c: any) => {
        prompt += `Q: ${c.question}\nA: ${c.answer}\n\n`;
      });
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: PLAN_GENERATION_SYSTEM_PROMPT,
      prompt,
    });

    // Create the PLAN artifact
    const artifact = await db.$transaction(async (tx) => {
      // Check if plan artifact already exists
      let planArtifact = await tx.artifact.findFirst({
        where: { workflowId, type: "PLAN" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });

      if (!planArtifact) {
        planArtifact = await tx.artifact.create({
          data: {
            workflowId,
            type: "PLAN",
            title: "Implementation Plan",
            versions: {
              create: {
                version: 1,
                content: text,
                status: "DRAFT",
              },
            },
          },
          include: { versions: true },
        });
      } else {
        // Create new version
        const nextVersion = (planArtifact.versions[0]?.version || 0) + 1;
        await tx.artifactVersion.create({
          data: {
            artifactId: planArtifact.id,
            version: nextVersion,
            content: text,
            status: "DRAFT",
          },
        });
      }

      // Ensure workflow is in PLANNING
      await tx.workflow.update({
        where: { id: workflowId },
        data: { status: "PLANNING" },
      });

      return planArtifact;
    });

    return jsonResponse({ success: true, artifactId: artifact.id, content: text }, 201);
  } catch (error) {
    console.error("Plan Generation Error:", error);
    return apiError("Failed to generate plan", 500);
  }
}