import { findingFingerprint, type ReviewFinding } from "@/shared/schemas/reviewFinding";

/**
 * Deterministic policy judge (blueprint §5.7, §12).
 *
 * An LLM may propose findings, but explicit rules decide the outcome. A numeric
 * score can never hide a critical issue, and a required analysis that did not run
 * yields INCOMPLETE — never PASS.
 */

export type ReviewOutcome = "PASS" | "COMMENT" | "REQUEST_CHANGES" | "INCOMPLETE";

/** Status of a required deterministic analyzer (lint/type/security/etc). */
export type CheckStatus = "PASSED" | "FAILED" | "SKIPPED" | "ERROR";

export interface ReviewCheck {
  analyzer: string;
  status: CheckStatus;
  required: boolean;
}

export interface JudgeInput {
  findings: ReviewFinding[];
  checks: ReviewCheck[];
}

export interface ReviewDecision {
  outcome: ReviewOutcome;
  reasons: string[];
  blockingFindingFingerprints: string[];
}

/** Only findings backed by evidence can influence a blocking decision. */
function isBlocking(finding: ReviewFinding): boolean {
  if (finding.validationStatus === "REJECTED") return false;
  if (finding.validationStatus !== "VERIFIED") return false;
  if (finding.severity === "CRITICAL") return true;
  // A verified HIGH correctness/security defect blocks; HIGH elsewhere comments.
  if (finding.severity === "HIGH") {
    return finding.category === "BUG" || finding.category === "SECURITY";
  }
  return false;
}

export function judgeReview(input: JudgeInput): ReviewDecision {
  const reasons: string[] = [];

  // 1. A required check that errored or could not run blocks a clean pass.
  const incompleteChecks = input.checks.filter(
    (c) => c.required && (c.status === "ERROR" || c.status === "SKIPPED"),
  );
  if (incompleteChecks.length > 0) {
    for (const check of incompleteChecks) {
      reasons.push(`Required analysis did not complete: ${check.analyzer} (${check.status})`);
    }
    return { outcome: "INCOMPLETE", reasons, blockingFindingFingerprints: [] };
  }

  // 2. A required check that ran and failed is a blocking signal.
  const failedRequired = input.checks.filter((c) => c.required && c.status === "FAILED");

  // 3. Evidence-backed blocking findings.
  const blocking = input.findings.filter(isBlocking);

  if (blocking.length > 0 || failedRequired.length > 0) {
    for (const check of failedRequired) {
      reasons.push(`Required check failed: ${check.analyzer}`);
    }
    for (const finding of blocking) {
      reasons.push(`Blocking ${finding.severity} ${finding.category}: ${finding.title}`);
    }
    return {
      outcome: "REQUEST_CHANGES",
      reasons,
      blockingFindingFingerprints: blocking.map(findingFingerprint),
    };
  }

  // 4. Non-blocking but non-rejected findings are worth surfacing.
  const commentable = input.findings.filter((f) => f.validationStatus !== "REJECTED");
  if (commentable.length > 0) {
    return {
      outcome: "COMMENT",
      reasons: [`${commentable.length} non-blocking finding(s) to review`],
      blockingFindingFingerprints: [],
    };
  }

  // 5. Nothing blocking, nothing to comment, all required checks passed.
  return { outcome: "PASS", reasons: ["No blocking issues; required checks passed"], blockingFindingFingerprints: [] };
}
