import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { SpecificationReviewAgent } from "@/agents/SpecificationReviewAgent";
import { ReviewCheckType, CheckStatus } from "@prisma/client";
import { WorkflowContext } from "@/workflow/engine/WorkflowContext";


export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { versionId, specContent } = await req.json();

    if (!versionId || !specContent) {
      return apiError("versionId and specContent are required", 400);
    }

    const agent = new SpecificationReviewAgent();
    // Create a mock context for the agent
    const ctx: WorkflowContext = {
      input: { workflowId: "mock", userId: user.id, rawIdea: "" },
      artifacts: {
        specification: { markdown: specContent, requirements: [] } as any
      },
      execution: { startedAt: new Date(), stages: [] }
    };

    const result = await agent.execute(ctx);

    // Save checks to DB
    await db.$transaction(async (tx) => {
      // Clear old checks for this version
      await tx.reviewCheck.deleteMany({ where: { versionId } });

      // Insert new checks
      for (const check of result.checks) {
        await tx.reviewCheck.create({
          data: {
            versionId,
            type: check.type as ReviewCheckType,
            status: check.status as CheckStatus,
            description: check.description,
          },
        });
      }
    });

    return jsonResponse(result.checks, 201);
  } catch (error) {
    console.error("Review Gate error:", error);
    return apiError("Failed to run review gate", 500);
  }
}
