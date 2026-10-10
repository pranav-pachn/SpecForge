import { describe, expect, it } from "vitest";
import { judgeReview, type ReviewCheck } from "@/server/policy/reviewJudge";
import type { ReviewFinding } from "@/shared/schemas/reviewFinding";

function finding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    category: "BUG",
    severity: "MEDIUM",
    confidence: "MEDIUM",
    title: "Example finding",
    description: "desc",
    filePath: "src/x.ts",
    startLine: 10,
    endLine: 12,
    evidence: "evidence",
    impact: "impact",
    suggestedFix: "fix",
    source: "AI",
    validationStatus: "VERIFIED",
    ...overrides,
  };
}

const passedCheck: ReviewCheck = { analyzer: "eslint", status: "PASSED", required: true };

describe("judgeReview", () => {
  it("PASS when there are no findings and required checks passed", () => {
    expect(judgeReview({ findings: [], checks: [passedCheck] }).outcome).toBe("PASS");
  });

  it("COMMENT for non-blocking findings", () => {
    const decision = judgeReview({ findings: [finding()], checks: [passedCheck] });
    expect(decision.outcome).toBe("COMMENT");
  });

  it("REQUEST_CHANGES for a verified critical finding", () => {
    const decision = judgeReview({
      findings: [finding({ severity: "CRITICAL", category: "SECURITY", title: "Secret leak" })],
      checks: [passedCheck],
    });
    expect(decision.outcome).toBe("REQUEST_CHANGES");
    expect(decision.blockingFindingFingerprints).toHaveLength(1);
  });

  it("a high score cannot hide a critical issue (no score override path)", () => {
    // Even with many passing checks, one verified critical still blocks.
    const decision = judgeReview({
      findings: [
        finding({ severity: "CRITICAL", category: "BUG", title: "Nullptr" }),
        finding({ severity: "LOW" }),
      ],
      checks: [passedCheck, { analyzer: "tsc", status: "PASSED", required: true }],
    });
    expect(decision.outcome).toBe("REQUEST_CHANGES");
  });

  it("REQUEST_CHANGES for a verified high BUG or SECURITY finding", () => {
    for (const category of ["BUG", "SECURITY"] as const) {
      const decision = judgeReview({
        findings: [finding({ severity: "HIGH", category })],
        checks: [passedCheck],
      });
      expect(decision.outcome, category).toBe("REQUEST_CHANGES");
    }
  });

  it("a high finding in a non-correctness category only comments", () => {
    const decision = judgeReview({
      findings: [finding({ severity: "HIGH", category: "MAINTAINABILITY" })],
      checks: [passedCheck],
    });
    expect(decision.outcome).toBe("COMMENT");
  });

  it("does not block on an unverified or rejected critical finding", () => {
    expect(
      judgeReview({
        findings: [finding({ severity: "CRITICAL", validationStatus: "UNVERIFIED" })],
        checks: [passedCheck],
      }).outcome,
    ).toBe("COMMENT");
    expect(
      judgeReview({
        findings: [finding({ severity: "CRITICAL", validationStatus: "REJECTED" })],
        checks: [passedCheck],
      }).outcome,
    ).toBe("PASS");
  });

  it("INCOMPLETE when a required check errored, never PASS", () => {
    const decision = judgeReview({
      findings: [],
      checks: [{ analyzer: "semgrep", status: "ERROR", required: true }],
    });
    expect(decision.outcome).toBe("INCOMPLETE");
  });

  it("INCOMPLETE when a required check was skipped", () => {
    const decision = judgeReview({
      findings: [finding({ severity: "CRITICAL", validationStatus: "VERIFIED" })],
      checks: [{ analyzer: "semgrep", status: "SKIPPED", required: true }],
    });
    // Incompleteness takes precedence: we cannot claim REQUEST_CHANGES is the full picture.
    expect(decision.outcome).toBe("INCOMPLETE");
  });

  it("a failed required check blocks even with no findings", () => {
    const decision = judgeReview({
      findings: [],
      checks: [{ analyzer: "tsc", status: "FAILED", required: true }],
    });
    expect(decision.outcome).toBe("REQUEST_CHANGES");
  });

  it("an optional skipped check does not force INCOMPLETE", () => {
    const decision = judgeReview({
      findings: [],
      checks: [passedCheck, { analyzer: "semgrep", status: "SKIPPED", required: false }],
    });
    expect(decision.outcome).toBe("PASS");
  });
});
