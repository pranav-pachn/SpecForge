import { apiError, getAuthenticatedUser, jsonResponse } from "@/infrastructure/services/api-helpers";
import { db } from "@/platform/storage/db";
import { toReviewRun } from "@/server/reviews/persistReview";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const run = await db.reviewRun.findFirst({
    where: { id: params.id, userId: user.id },
    include: { findings: { include: { feedback: true } }, checks: true },
  });
  if (!run) return apiError("Review not found", 404);

  return jsonResponse(toReviewRun(run, user.id));
}
