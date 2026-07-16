import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { gateway } from "@/lib/ai/gateway/gateway";
import { ReviewCheckType, CheckStatus } from "@prisma/client";

const REVIEW_GATE_PROMPT = `
You are a Staff Software Engineer reviewing a feature specification. You need to act as a strict gatekeeper before this spec is allowed to proceed to the Planning and Task Breakdown phase.

Evaluate the specification strictly against these 4 criteria:
1. REQUIREMENT_COVERAGE: Are all user stories and functional requirements clearly covered?
2. TEST_COVERAGE: Are the functional requirements testable? (Look for clear Acceptance Criteria).
3. ASSUMPTION_RISK: Are technical constraints, external dependencies, edge cases, and risks explicitly named?
4. CONSISTENCY: Is the spec consistent internally? Are success metrics clearly defined?

Respond with a JSON object containing an array of 'checks'. Each check must have:
- "type": One of ["REQUIREMENT_COVERAGE", "TEST_COVERAGE", "ASSUMPTION_RISK", "CONSISTENCY"]
- "status": "PASSED" or "FAILED"
- "description": A short 1-2 sentence explanation of your verdict.

Example response:
{
  "checks": [
    {
      "type": "TEST_COVERAGE",
      "status": "FAILED",
      "description": "Acceptance criteria exist but lack specific edge-case assertions."
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { versionId, specContent } = await req.json();

    if (!versionId || !specContent) {
      return apiError("versionId and specContent are required", 400);
    }

    const { text } = await gateway.execute({
      capability: "review_gate",
      system: REVIEW_GATE_PROMPT,
      prompt: `Analyze this specification:\n\n${specContent}`,
    });

    let result;
    try {
      const jsonStr = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
      result = JSON.parse(jsonStr);
    } catch (e) {
      return apiError("AI generated invalid response format", 500);
    }

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
