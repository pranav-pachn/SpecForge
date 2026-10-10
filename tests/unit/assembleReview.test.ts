import { describe, expect, it } from "vitest";
import { assembleReview, ReviewModelInvalid } from "@/server/reviews/assembleReview";
import type { CreateReviewRequest } from "@/shared/schemas/review";

const diff = `--- a/src/example.ts
+++ b/src/example.ts
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = user.id;
 const d = 5;
`;

const input: CreateReviewRequest = { kind: "DIFF", content: diff, language: "typescript" };

function modelFinding(overrides: Record<string, unknown> = {}) {
  return {
    category: "BUG",
    severity: "CRITICAL",
    confidence: "HIGH",
    title: "Unchecked user id",
    description: "user.id is read without a guard",
    filePath: "src/example.ts",
    startLine: 2,
    endLine: 2,
    evidence: "const b = user.id;",
    impact: "Throws when user is missing",
    suggestedFix: "Check user before reading id",
    ...overrides,
  };
}

describe("assembleReview", () => {
  it("verifies a finding whose evidence and line are in the diff and blocks on it", () => {
    const review = assembleReview(input, { summary: "One defect.", findings: [modelFinding()] });
    expect(review.findings[0].validationStatus).toBe("VERIFIED");
    expect(review.decision.outcome).toBe("REQUEST_CHANGES");
    expect(review.checks[0]).toMatchObject({ analyzer: "typescript", status: "SKIPPED", required: false });
  });

  it("rejects a finding that names a file outside the diff", () => {
    const review = assembleReview(input, {
      summary: "Invented.",
      findings: [modelFinding({ filePath: "src/missing.ts" })],
    });
    expect(review.findings[0].validationStatus).toBe("REJECTED");
    expect(review.decision.outcome).toBe("PASS");
  });

  it("does not let an unverified critical finding request changes", () => {
    const review = assembleReview(input, {
      summary: "Unanchored.",
      findings: [modelFinding({ evidence: "this snippet is not in the diff", startLine: 99, endLine: 99 })],
    });
    expect(review.findings[0].validationStatus).toBe("UNVERIFIED");
    expect(review.decision.outcome).toBe("COMMENT");
  });

  it("drops a finding that fails the canonical schema", () => {
    const review = assembleReview(input, {
      summary: "Bad line range.",
      findings: [modelFinding({ startLine: 9, endLine: 2 })],
    });
    expect(review.findings).toHaveLength(0);
    expect(review.droppedFindings).toBe(1);
    expect(review.summary).toContain("dropped");
  });

  it("throws when the model object is not a review", () => {
    expect(() => assembleReview(input, { findings: "nope" })).toThrow(ReviewModelInvalid);
  });
});
