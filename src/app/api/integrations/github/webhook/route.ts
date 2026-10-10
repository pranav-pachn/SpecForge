import { NextRequest } from "next/server";
import { apiError, jsonResponse } from "@/infrastructure/services/api-helpers";
import { claimPullRequestReview, executeClaimedReview } from "@/server/github/ingestPullRequest";
import { parseGithubWebhook } from "@/server/github/parseWebhook";
import { verifyGithubWebhookSignature } from "@/server/github/webhookSignature";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "";
  if (!secret) return apiError("GitHub webhook is not configured", 503);

  const rawBody = await req.text();
  if (!verifyGithubWebhookSignature(rawBody, req.headers.get("x-hub-signature-256"), secret)) {
    return apiError("Invalid webhook signature", 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = parseGithubWebhook(req.headers.get("x-github-event"), payload);
  if (parsed.kind === "invalid") return apiError(parsed.reason, 400);
  if (parsed.kind === "ignored") return jsonResponse({ status: "ignored", reason: parsed.reason });

  const claimed = await claimPullRequestReview(parsed.event);
  if (claimed.status === "accepted") {
    void executeClaimedReview(claimed.reviewId);
  }
  if (claimed.status === "unconnected") {
    return jsonResponse({ status: "unconnected" });
  }
  return jsonResponse(claimed, 202);
}
