import { z } from "zod";

/**
 * Canonical review-finding contract (blueprint §9).
 * Every AI or static-analyzer finding normalizes into this one validated shape
 * before it is scored, persisted, or displayed. Enums are closed so provider
 * output cannot smuggle unknown categories/severities into product logic.
 */

export const FindingCategory = z.enum([
  "BUG",
  "SECURITY",
  "DESIGN",
  "PERFORMANCE",
  "MAINTAINABILITY",
  "TESTING",
]);
export type FindingCategory = z.infer<typeof FindingCategory>;

export const FindingSeverity = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
export type FindingSeverity = z.infer<typeof FindingSeverity>;

export const FindingConfidence = z.enum(["HIGH", "MEDIUM", "LOW"]);
export type FindingConfidence = z.infer<typeof FindingConfidence>;

export const FindingSource = z.enum(["AI", "STATIC_ANALYZER", "CI", "MANUAL"]);
export type FindingSource = z.infer<typeof FindingSource>;

export const FindingValidationStatus = z.enum(["VERIFIED", "UNVERIFIED", "REJECTED"]);
export type FindingValidationStatus = z.infer<typeof FindingValidationStatus>;

/**
 * Line references are nullable: when diff-to-source line mapping is unreliable
 * the finding must still be representable rather than carrying a fabricated line.
 */
export const ReviewFindingSchema = z
  .object({
    category: FindingCategory,
    severity: FindingSeverity,
    confidence: FindingConfidence,
    title: z.string().min(1),
    description: z.string().min(1),
    filePath: z.string().min(1).nullable(),
    startLine: z.number().int().positive().nullable(),
    endLine: z.number().int().positive().nullable(),
    evidence: z.string().min(1),
    impact: z.string().min(1),
    suggestedFix: z.string().min(1).nullable(),
    source: FindingSource,
    validationStatus: FindingValidationStatus,
  })
  .refine(
    (f) => f.startLine === null || f.endLine === null || f.endLine >= f.startLine,
    { message: "endLine must be greater than or equal to startLine", path: ["endLine"] },
  )
  .refine((f) => f.startLine === null || f.filePath !== null, {
    message: "a line reference requires a filePath",
    path: ["filePath"],
  });

export type ReviewFinding = z.infer<typeof ReviewFindingSchema>;

/**
 * Stable fingerprint for deduplication and idempotent persistence (blueprint §5.6, §12).
 * Location-free so the same defect reported by two sources collapses to one entry,
 * and model self-reported confidence is deliberately excluded (it is not calibrated).
 */
export function findingFingerprint(
  f: Pick<ReviewFinding, "category" | "severity" | "filePath" | "startLine" | "title">,
): string {
  const normalizedTitle = f.title.toLowerCase().replace(/\s+/g, " ").trim();
  return [
    f.category,
    f.severity,
    f.filePath ?? "no-file",
    f.startLine ?? "no-line",
    normalizedTitle,
  ].join("|");
}

/** Drops exact duplicates by fingerprint, keeping first occurrence order. */
export function dedupeFindings(findings: ReviewFinding[]): ReviewFinding[] {
  const seen = new Set<string>();
  const out: ReviewFinding[] = [];
  for (const finding of findings) {
    const key = findingFingerprint(finding);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}
