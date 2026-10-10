import { describe, expect, it } from "vitest";
import {
  CreateReviewRequestSchema,
  ReviewRunSchema,
  REVIEW_LIMITS,
} from "@/shared/schemas/review";

describe("CreateReviewRequestSchema", () => {
  it("accepts a minimal valid code submission", () => {
    const res = CreateReviewRequestSchema.safeParse({ kind: "CODE", content: "const a = 1;" });
    expect(res.success).toBe(true);
  });

  it("accepts a diff submission with language and context", () => {
    const res = CreateReviewRequestSchema.safeParse({
      kind: "DIFF",
      content: "--- a/f\n+++ b/f\n@@ -1 +1 @@\n-a\n+b\n",
      language: "typescript",
      context: "follows repo conventions",
    });
    expect(res.success).toBe(true);
  });

  it("rejects empty content", () => {
    expect(CreateReviewRequestSchema.safeParse({ kind: "CODE", content: "" }).success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    expect(CreateReviewRequestSchema.safeParse({ kind: "SNIPPET", content: "x" }).success).toBe(false);
  });

  it("rejects content over the byte limit", () => {
    const tooBig = "a".repeat(REVIEW_LIMITS.maxInputBytes + 1);
    expect(CreateReviewRequestSchema.safeParse({ kind: "CODE", content: tooBig }).success).toBe(false);
  });

  it("rejects context over the byte limit", () => {
    const res = CreateReviewRequestSchema.safeParse({
      kind: "CODE",
      content: "x",
      context: "c".repeat(REVIEW_LIMITS.maxContextBytes + 1),
    });
    expect(res.success).toBe(false);
  });

  it("counts multi-byte characters by byte length, not code points", () => {
    // '€' is 3 bytes in UTF-8; fill just past the limit using fewer characters.
    const chars = Math.floor(REVIEW_LIMITS.maxInputBytes / 3) + 1;
    const res = CreateReviewRequestSchema.safeParse({ kind: "CODE", content: "€".repeat(chars) });
    expect(res.success).toBe(false);
  });
});

describe("ReviewRunSchema", () => {
  it("validates a completed run shape", () => {
    const run = {
      id: "run-1",
      source: "MANUAL",
      status: "COMPLETED",
      outcome: "PASS",
      summary: "No blocking issues.",
      decisionReasons: ["No blocking issues; required checks passed"],
      findings: [],
      checks: [{ analyzer: "eslint", status: "PASSED", summary: null, required: true }],
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    expect(ReviewRunSchema.safeParse(run).success).toBe(true);
  });

  it("allows a null outcome for a run still in progress", () => {
    const run = {
      id: "run-2",
      source: "MANUAL",
      status: "RUNNING",
      outcome: null,
      summary: null,
      decisionReasons: [],
      findings: [],
      checks: [],
      provider: null,
      model: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    expect(ReviewRunSchema.safeParse(run).success).toBe(true);
  });
});
