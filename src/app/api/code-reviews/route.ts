import { NextRequest } from "next/server";
import { apiError, getAuthenticatedUser, jsonResponse } from "@/infrastructure/services/api-helpers";
import { db } from "@/platform/storage/db";
import { CreateReviewRequestSchema } from "@/shared/schemas/review";
import { analyzeReview } from "@/server/reviews/analyzeReview";
import { persistReview } from "@/server/reviews/persistReview";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const runs = await db.reviewRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      outcome: true,
      summary: true,
      inputKind: true,
      language: true,
      createdAt: true,
      _count: { select: { findings: true } },
    },
  });

  return jsonResponse(runs.map((run) => ({
    id: run.id,
    status: run.status,
    outcome: run.outcome,
    summary: run.summary,
    inputKind: run.inputKind,
    language: run.language,
    findingCount: run._count.findings,
    createdAt: run.createdAt.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = CreateReviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid review request", 400);
  }

  const analysis = await analyzeReview(parsed.data);
  const run = await persistReview(user.id, parsed.data, analysis);
  return jsonResponse({ id: run.id, status: run.status, outcome: run.outcome }, 201);
}
