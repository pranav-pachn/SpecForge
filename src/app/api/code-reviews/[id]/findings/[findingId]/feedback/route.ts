import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getAuthenticatedUser, jsonResponse } from "@/infrastructure/services/api-helpers";
import { db } from "@/platform/storage/db";
import { FeedbackVerdict } from "@/shared/schemas/review";

export const dynamic = "force-dynamic";

const FeedbackBodySchema = z.object({
  verdict: FeedbackVerdict,
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; findingId: string } },
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }
  const parsed = FeedbackBodySchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid feedback", 400);

  const finding = await db.reviewRunFinding.findFirst({
    where: { id: params.findingId, runId: params.id, run: { userId: user.id } },
    select: { id: true },
  });
  if (!finding) return apiError("Finding not found", 404);

  const feedback = await db.reviewFeedback.upsert({
    where: { findingId_userId: { findingId: finding.id, userId: user.id } },
    create: {
      findingId: finding.id,
      userId: user.id,
      verdict: parsed.data.verdict,
      reason: parsed.data.reason ?? null,
    },
    update: {
      verdict: parsed.data.verdict,
      reason: parsed.data.reason ?? null,
    },
    select: { verdict: true },
  });

  return jsonResponse({ verdict: feedback.verdict });
}
