import { Prisma } from "@prisma/client";
import { db } from "@/platform/storage/db";
import { REVIEW_LIMITS, type CreateReviewRequest } from "@/shared/schemas/review";
import { analyzeReview } from "@/server/reviews/analyzeReview";
import type { ReviewAnalysis } from "@/server/reviews/analyzeReview";
import { completeReviewRun } from "@/server/reviews/persistReview";
import { fetchPullRequestDiff, publishCheckRun } from "./githubClient";
import { resolveGithubToken } from "./githubAuth";
import { githubReviewIdempotencyKey, type PullRequestWebhook } from "./parseWebhook";

export type IngestResult =
  | { status: "duplicate"; reviewId: string }
  | { status: "unconnected" }
  | { status: "accepted"; reviewId: string };

function incompleteAnalysis(summary: string, reason: string): ReviewAnalysis {
  return {
    summary,
    findings: [],
    decision: { outcome: "INCOMPLETE", reasons: [reason], blockingFindingFingerprints: [] },
    checks: [{ analyzer: "github_diff", status: "ERROR", required: true, summary: reason }],
    droppedFindings: 0,
    status: "INCOMPLETE",
    provider: null,
    model: null,
    fallbackUsed: false,
  };
}

export async function claimPullRequestReview(event: PullRequestWebhook): Promise<IngestResult> {
  const key = githubReviewIdempotencyKey(event);
  const existing = await db.reviewRun.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
  if (existing) return { status: "duplicate", reviewId: existing.id };

  const connection = await db.repositoryConnection.findUnique({
    where: { provider_owner_repo: { provider: "github", owner: event.owner, repo: event.repo } },
  });
  if (!connection) return { status: "unconnected" };

  if (event.installationId && connection.installationId !== event.installationId) {
    await db.repositoryConnection.update({
      where: { id: connection.id },
      data: { installationId: event.installationId },
    });
  }

  const pullRequest = await db.pullRequest.upsert({
    where: {
      connectionId_number_headSha: {
        connectionId: connection.id,
        number: event.number,
        headSha: event.headSha,
      },
    },
    create: {
      connectionId: connection.id,
      number: event.number,
      title: event.title.slice(0, 300),
      url: event.url,
      baseSha: event.baseSha,
      headSha: event.headSha,
    },
    update: { title: event.title.slice(0, 300), url: event.url, baseSha: event.baseSha, state: "open" },
  });

  try {
    const run = await db.reviewRun.create({
      data: {
        userId: connection.userId,
        pullRequestId: pullRequest.id,
        source: "GITHUB_PR",
        status: "QUEUED",
        inputKind: "DIFF",
        baseSha: event.baseSha,
        headSha: event.headSha,
        idempotencyKey: key,
        summary: `Review queued for ${event.owner}/${event.repo}#${event.number}`,
      },
      select: { id: true },
    });
    return { status: "accepted", reviewId: run.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await db.reviewRun.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
      if (raced) return { status: "duplicate", reviewId: raced.id };
    }
    throw error;
  }
}

export async function executeClaimedReview(reviewId: string): Promise<void> {
  const run = await db.reviewRun.findUnique({
    where: { id: reviewId },
    include: { pullRequest: { include: { connection: true } } },
  });
  if (!run?.pullRequest?.connection || !run.headSha || run.status !== "QUEUED") return;

  await db.reviewRun.update({ where: { id: reviewId }, data: { status: "RUNNING" } });
  const { connection, number, title } = run.pullRequest;

  try {
    const token = await resolveGithubToken(connection.installationId);
    if (!token) {
      await completeReviewRun(reviewId, incompleteAnalysis(
        "GitHub credentials are not configured.",
        "No installation token or GITHUB_TOKEN is available to fetch the pull request diff.",
      ));
      return;
    }

    const diff = await fetchPullRequestDiff({
      owner: connection.owner,
      repo: connection.repo,
      number,
      token,
    });
    if (!diff.ok) {
      const analysis = incompleteAnalysis(
        "The pull request diff could not be fetched.",
        `GitHub returned HTTP ${diff.status} while fetching the diff.`,
      );
      await completeReviewRun(reviewId, analysis);
      return;
    }

    const bytes = new TextEncoder().encode(diff.diff).length;
    if (bytes === 0 || bytes > REVIEW_LIMITS.maxInputBytes) {
      await completeReviewRun(reviewId, incompleteAnalysis(
        "The pull request diff is outside the review size limit.",
        bytes === 0 ? "The diff was empty." : `Diff is ${bytes} bytes; limit is ${REVIEW_LIMITS.maxInputBytes}.`,
      ));
      return;
    }

    const request: CreateReviewRequest = { kind: "DIFF", content: diff.diff, context: title };
    const analysis = await analyzeReview(request);
    await completeReviewRun(reviewId, analysis);

    try {
      const published = await publishCheckRun({
        owner: connection.owner,
        repo: connection.repo,
        token,
        headSha: run.headSha,
        outcome: analysis.decision.outcome,
        summary: analysis.summary,
        reasons: analysis.decision.reasons,
      });
      if (!published.ok) {
        await db.reviewRun.update({
          where: { id: reviewId },
          data: { summary: `${analysis.summary} GitHub check run was not published (HTTP ${published.status}).` },
        });
      }
    } catch {
      await db.reviewRun.update({
        where: { id: reviewId },
        data: { summary: `${analysis.summary} GitHub check run was not published.` },
      });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 200) : "Review execution failed";
    await completeReviewRun(reviewId, incompleteAnalysis("The GitHub review did not finish.", reason));
  }
}
