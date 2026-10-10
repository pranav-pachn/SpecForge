import ts from "typescript";
import { parseUnifiedDiff } from "@/server/analysis/diffParser";
import type { CreateReviewRequest } from "@/shared/schemas/review";
import type { ReviewFinding } from "@/shared/schemas/reviewFinding";

const JS_LANGUAGE = /^(ts|tsx|js|jsx|typescript|javascript)$/i;
const JS_PATH = /\.(tsx|ts|jsx|js)$/i;

interface SourceLine {
  filePath: string | null;
  line: number;
  text: string;
}

interface StaticRule {
  id: string;
  pattern: RegExp;
  title: string;
  description: string;
  impact: string;
  suggestedFix: string;
}

const SECURITY_RULES: StaticRule[] = [
  {
    id: "no-eval",
    pattern: /\beval\s*\(/,
    title: "eval() executes a string as code",
    description: "The submission calls eval on a string.",
    impact: "eval runs arbitrary code in the current scope.",
    suggestedFix: "Remove eval and call a specific function instead.",
  },
  {
    id: "no-function-constructor",
    pattern: /\bnew\s+Function\s*\(/,
    title: "Function constructor executes a string as code",
    description: "The submission builds a function from a string.",
    impact: "The Function constructor runs arbitrary code.",
    suggestedFix: "Replace new Function with a normal function declaration.",
  },
  {
    id: "sql-interpolation",
    pattern: /select\b[\s\S]{0,120}\$\{/i,
    title: "SQL is built with string interpolation",
    description: "A SQL statement includes an interpolated value.",
    impact: "Untrusted input in the SQL string can change the query.",
    suggestedFix: "Pass the value as a bound parameter instead of interpolating it.",
  },
];

function isJavaScript(language: string | undefined, filePath: string | null): boolean {
  if (language && JS_LANGUAGE.test(language.trim())) return true;
  if (filePath && JS_PATH.test(filePath)) return true;
  return false;
}

function codeFileName(language: string | undefined): string | null {
  if (language && !JS_LANGUAGE.test(language.trim())) return null;
  if (/tsx|jsx/i.test(language ?? "")) return "snippet.tsx";
  return "snippet.ts";
}

function scriptKind(filePath: string): ts.ScriptKind {
  if (/\.(tsx|jsx)$/i.test(filePath)) return ts.ScriptKind.TSX;
  return ts.ScriptKind.TS;
}

function linesOf(text: string, filePath: string | null): SourceLine[] {
  return text.split(/\r?\n/).map((line, index) => ({ filePath, line: index + 1, text: line }));
}

function sourcesFor(input: CreateReviewRequest): { lines: SourceLine[]; completeFiles: Array<{ filePath: string; text: string }> } {
  if (input.kind === "CODE") {
    const filePath = codeFileName(input.language);
    if (!filePath) return { lines: [], completeFiles: [] };
    return {
      lines: linesOf(input.content, filePath),
      completeFiles: [{ filePath, text: input.content }],
    };
  }

  const diff = parseUnifiedDiff(input.content);
  const lines: SourceLine[] = [];
  const completeFiles: Array<{ filePath: string; text: string }> = [];
  for (const file of diff.files) {
    const filePath = file.newPath;
    if (!filePath || !isJavaScript(input.language, filePath)) continue;
    const added = file.hunks.flatMap((hunk) => hunk.lines.filter((line) => line.type === "add" && line.newLine !== null));
    for (const line of added) {
      lines.push({ filePath, line: line.newLine as number, text: line.content });
    }
    if (file.changeType === "added") {
      completeFiles.push({ filePath, text: added.map((line) => line.content).join("\n") });
    }
  }
  return { lines, completeFiles };
}

function syntaxFindings(filePath: string, text: string): ReviewFinding[] {
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, scriptKind(filePath));
  const diagnostics = (source as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  return diagnostics.slice(0, 20).map((diagnostic) => {
    const start = diagnostic.start ?? 0;
    const line = source.getLineAndCharacterOfPosition(start).line + 1;
    const evidence = source.text.split(/\r?\n/)[line - 1]?.trim() || ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    return {
      category: "BUG" as const,
      severity: "HIGH" as const,
      confidence: "HIGH" as const,
      title: "Syntax error",
      description: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
      filePath,
      startLine: line,
      endLine: line,
      evidence,
      impact: "The file does not parse, so later checks cannot trust it.",
      suggestedFix: "Correct the syntax error.",
      source: "STATIC_ANALYZER" as const,
      validationStatus: "VERIFIED" as const,
    };
  });
}

function securityFindings(lines: SourceLine[]): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const seen = new Set<string>();
  for (const rule of SECURITY_RULES) {
    for (const line of lines) {
      if (!rule.pattern.test(line.text)) continue;
      const key = `${rule.id}:${line.filePath}:${line.line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        category: "SECURITY",
        severity: "HIGH",
        confidence: "HIGH",
        title: rule.title,
        description: rule.description,
        filePath: line.filePath,
        startLine: line.line,
        endLine: line.line,
        evidence: line.text.trim(),
        impact: rule.impact,
        suggestedFix: rule.suggestedFix,
        source: "STATIC_ANALYZER",
        validationStatus: "VERIFIED",
      });
      break;
    }
  }
  return findings;
}

export interface StaticAnalyzerCheck {
  analyzer: string;
  status: "PASSED" | "FAILED" | "SKIPPED" | "ERROR";
  required: boolean;
  summary: string | null;
}

export interface StaticCheckResult {
  findings: ReviewFinding[];
  checks: StaticAnalyzerCheck[];
}

/**
 * Parses and scans the submission. It does not execute the submitted code.
 * A language outside TypeScript/JavaScript is skipped, never reported as passed.
 */
export function runStaticChecks(input: CreateReviewRequest): StaticCheckResult {
  const applicable = input.kind === "CODE"
    ? codeFileName(input.language) !== null
    : isJavaScript(input.language, null) || parseUnifiedDiff(input.content).files.some((file) => isJavaScript(undefined, file.newPath));

  if (!applicable) {
    return {
      findings: [],
      checks: [{
        analyzer: "typescript",
        status: "SKIPPED",
        required: false,
        summary: "Static checks run for TypeScript and JavaScript only.",
      }],
    };
  }

  try {
    const { lines, completeFiles } = sourcesFor(input);
    const findings = securityFindings(lines);
    const checks: StaticAnalyzerCheck[] = [];

    if (completeFiles.length === 0) {
      checks.push({
        analyzer: "typescript",
        status: "SKIPPED",
        required: false,
        summary: "Syntax check needs a complete file. A partial diff was not parsed.",
      });
    } else {
      for (const file of completeFiles) {
        findings.push(...syntaxFindings(file.filePath, file.text));
      }
      const syntaxErrors = findings.filter((finding) => finding.title === "Syntax error").length;
      checks.push({
        analyzer: "typescript",
        status: syntaxErrors > 0 ? "FAILED" : "PASSED",
        required: true,
        summary: syntaxErrors > 0 ? `${syntaxErrors} syntax error(s).` : "The submission parsed.",
      });
    }

    const securityHits = findings.filter((finding) => finding.category === "SECURITY").length;
    checks.push({
      analyzer: "security-patterns",
      status: securityHits > 0 ? "FAILED" : "PASSED",
      required: true,
      summary: securityHits > 0 ? `${securityHits} security pattern(s) matched.` : "No eval, Function constructor, or interpolated SQL.",
    });

    return { findings, checks };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Static analysis failed";
    return {
      findings: [],
      checks: [{
        analyzer: "typescript",
        status: "ERROR",
        required: true,
        summary: message.slice(0, 200),
      }],
    };
  }
}
