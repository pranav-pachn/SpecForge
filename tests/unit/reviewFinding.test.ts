import { describe, expect, it } from "vitest";
import {
  ReviewFindingSchema,
  findingFingerprint,
  dedupeFindings,
  type ReviewFinding,
} from "@/shared/schemas/reviewFinding";

function finding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    category: "BUG",
    severity: "HIGH",
    confidence: "HIGH",
    title: "Request data used before validation",
    description: "The changed code dereferences a field before checking it.",
    filePath: "src/example.ts",
    startLine: 42,
    endLine: 44,
    evidence: "Line 42 accesses body.user.id before the guard on line 46.",
    impact: "Malformed requests fail at runtime.",
    suggestedFix: "Validate the payload before dereferencing it.",
    source: "AI",
    validationStatus: "VERIFIED",
    ...overrides,
  };
}

describe("ReviewFindingSchema", () => {
  it("accepts a well-formed finding", () => {
    expect(ReviewFindingSchema.safeParse(finding()).success).toBe(true);
  });

  it("rejects an unknown category", () => {
    const res = ReviewFindingSchema.safeParse({ ...finding(), category: "STYLE" });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown severity", () => {
    expect(ReviewFindingSchema.safeParse({ ...finding(), severity: "BLOCKER" }).success).toBe(false);
  });

  it("allows null line references for unreliable mapping", () => {
    const res = ReviewFindingSchema.safeParse(
      finding({ filePath: "src/x.ts", startLine: null, endLine: null }),
    );
    expect(res.success).toBe(true);
  });

  it("rejects endLine before startLine", () => {
    expect(ReviewFindingSchema.safeParse(finding({ startLine: 50, endLine: 10 })).success).toBe(false);
  });

  it("rejects a line reference without a file path", () => {
    expect(
      ReviewFindingSchema.safeParse(finding({ filePath: null, startLine: 5, endLine: 5 })).success,
    ).toBe(false);
  });

  it("rejects empty evidence", () => {
    expect(ReviewFindingSchema.safeParse(finding({ evidence: "" })).success).toBe(false);
  });

  it("allows a null suggestedFix", () => {
    expect(ReviewFindingSchema.safeParse(finding({ suggestedFix: null })).success).toBe(true);
  });
});

describe("findingFingerprint / dedupeFindings", () => {
  it("is stable across whitespace and case differences in the title", () => {
    const a = findingFingerprint(finding({ title: "Null  Deref" }));
    const b = findingFingerprint(finding({ title: "null deref" }));
    expect(a).toBe(b);
  });

  it("differs when the location or category changes", () => {
    const base = findingFingerprint(finding());
    expect(findingFingerprint(finding({ startLine: 99 }))).not.toBe(base);
    expect(findingFingerprint(finding({ category: "SECURITY" }))).not.toBe(base);
  });

  it("collapses duplicates reported by different sources", () => {
    const fromAi = finding({ source: "AI" });
    const fromTool = finding({ source: "STATIC_ANALYZER" });
    const deduped = dedupeFindings([fromAi, fromTool, finding({ startLine: 7 })]);
    expect(deduped).toHaveLength(2);
  });
});
