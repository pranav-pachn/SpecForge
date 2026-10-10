import { describe, expect, it } from "vitest";
import { runStaticChecks } from "@/server/analysis/staticCheck";
import { assembleReview } from "@/server/reviews/assembleReview";

describe("runStaticChecks", () => {
  it("passes a parsed TypeScript snippet with no security pattern", () => {
    const result = runStaticChecks({ kind: "CODE", content: "export const answer = 42;\n", language: "typescript" });
    expect(result.findings).toHaveLength(0);
    expect(result.checks).toEqual([
      expect.objectContaining({ analyzer: "typescript", status: "PASSED", required: true }),
      expect.objectContaining({ analyzer: "security-patterns", status: "PASSED", required: true }),
    ]);
  });

  it("fails a syntax error and keeps the evidence line", () => {
    const result = runStaticChecks({ kind: "CODE", content: "export function {\n", language: "typescript" });
    const syntax = result.checks.find((check) => check.analyzer === "typescript");
    expect(syntax?.status).toBe("FAILED");
    expect(result.findings.some((finding) => finding.title === "Syntax error" && finding.validationStatus === "VERIFIED")).toBe(true);
  });

  it("flags eval without executing it", () => {
    const result = runStaticChecks({
      kind: "CODE",
      content: "export function run(input: string) {\n  return eval(input);\n}\n",
      language: "typescript",
    });
    const finding = result.findings.find((item) => item.title.includes("eval"));
    expect(finding?.source).toBe("STATIC_ANALYZER");
    expect(finding?.evidence).toContain("eval(input)");
    expect(result.checks.find((check) => check.analyzer === "security-patterns")?.status).toBe("FAILED");
  });

  it("flags interpolated SQL in an added diff line", () => {
    const diff = [
      "--- a/src/api/keys.ts",
      "+++ b/src/api/keys.ts",
      "@@ -1,2 +1,3 @@",
      " export function getKey(id: string) {",
      "-  return null;",
      "+  const sql = `SELECT secret FROM api_keys WHERE id = '${id}'`;",
      "+  return db.query(sql);",
      " }",
      "",
    ].join("\n");
    const result = runStaticChecks({ kind: "DIFF", content: diff, language: "typescript" });
    expect(result.findings.some((finding) => finding.title.includes("SQL"))).toBe(true);
    expect(result.checks.find((check) => check.analyzer === "typescript")?.status).toBe("SKIPPED");
  });

  it("skips non-JavaScript instead of reporting a pass", () => {
    const result = runStaticChecks({ kind: "CODE", content: "print('hi')\n", language: "python" });
    expect(result.findings).toHaveLength(0);
    expect(result.checks).toEqual([
      expect.objectContaining({ analyzer: "typescript", status: "SKIPPED", required: false }),
    ]);
  });
});

describe("static findings affect the decision", () => {
  it("requests changes for a verified eval finding even when the model reports nothing", () => {
    const review = assembleReview(
      { kind: "CODE", content: "export const run = (input: string) => eval(input);\n", language: "typescript" },
      { summary: "Looks fine.", findings: [] },
    );
    expect(review.decision.outcome).toBe("REQUEST_CHANGES");
    expect(review.findings.some((finding) => finding.source === "STATIC_ANALYZER")).toBe(true);
  });
});
