import { db } from "@/platform/storage/db";
import type { CreateReviewRequest, ReviewRun } from "@/shared/schemas/review";
import { findingFingerprint } from "@/shared/schemas/reviewFinding";
import type { ReviewAnalysis } from "./analyzeReview";

export type { ReviewAnalysis };

export async function persistReview(userId: string, input: CreateReviewRequest, analysis: ReviewAnalysis) {
  const run = await db.reviewRun.create({
    data: {
      userId,
      source: "MANUAL",
      status: analysis.status === "COMPLETED" ? "COMPLETED" : analysis.status,
      outcome: analysis.decision.outcome,
      inputKind: input.kind,
      language: input.language ?? null,
      provider: analysis.provider,
      model: analysis.model,
      summary: analysis.summary,
      decisionReasons: analysis.decision.reasons,
      completedAt: new Date(),
      findings: {
        create: analysis.findings.map((finding) => ({
          category: finding.category,
          severity: finding.severity,
          confidence: finding.confidence,
          title: finding.title,
          description: finding.description,
          filePath: finding.filePath,
          startLine: finding.startLine,
          endLine: finding.endLine,
          evidence: finding.evidence,
          impact: finding.impact,
          suggestedFix: finding.suggestedFix,
          source: finding.source,
          validationStatus: finding.validationStatus,
          fingerprint: findingFingerprint(finding),
        })),
      },
      checks: {
        create: analysis.checks.map((check) => ({
          analyzer: check.analyzer,
          status: check.status,
          required: check.required,
          summary: check.summary,
        })),
      },
    },
    include: { findings: true, checks: true },
  });

  return toReviewRun(run);
}

type StoredFinding = {
  id: string;
  category: ReviewRun["findings"][number]["category"];
  severity: ReviewRun["findings"][number]["severity"];
  confidence: ReviewRun["findings"][number]["confidence"];
  title: string;
  description: string;
  filePath: string | null;
  startLine: number | null;
  endLine: number | null;
  evidence: string;
  impact: string;
  suggestedFix: string | null;
  source: ReviewRun["findings"][number]["source"];
  validationStatus: ReviewRun["findings"][number]["validationStatus"];
  feedback?: Array<{ userId: string; verdict: "ACCEPTED" | "DISMISSED" }>;
};

type StoredRun = {
  id: string;
  source: ReviewRun["source"];
  status: ReviewRun["status"];
  outcome: ReviewRun["outcome"];
  summary: string | null;
  decisionReasons?: string[];
  provider: string | null;
  model: string | null;
  createdAt: Date;
  completedAt: Date | null;
  findings: StoredFinding[];
  checks: Array<{
    analyzer: string;
    status: ReviewRun["checks"][number]["status"];
    required: boolean;
    summary: string | null;
  }>;
};

export function toReviewRun(run: StoredRun, viewerUserId?: string): ReviewRun {
  return {
    id: run.id,
    source: run.source,
    status: run.status,
    outcome: run.outcome,
    summary: run.summary,
    decisionReasons: run.decisionReasons ?? [],
    provider: run.provider,
    model: run.model,
    createdAt: run.createdAt.toISOString(),
    completedAt: run.completedAt ? run.completedAt.toISOString() : null,
    findings: run.findings.map((finding) => ({
      id: finding.id,
      category: finding.category,
      severity: finding.severity,
      confidence: finding.confidence,
      title: finding.title,
      description: finding.description,
      filePath: finding.filePath,
      startLine: finding.startLine,
      endLine: finding.endLine,
      evidence: finding.evidence,
      impact: finding.impact,
      suggestedFix: finding.suggestedFix,
      source: finding.source,
      validationStatus: finding.validationStatus,
      feedback: finding.feedback?.find((item) => item.userId === viewerUserId)?.verdict ?? null,
    })),
    checks: run.checks.map((check) => ({
      analyzer: check.analyzer,
      status: check.status,
      required: check.required,
      summary: check.summary,
    })),
  };
}

/** Fills a queued GitHub review with analysis results. No-ops if another worker already left QUEUED. */
export async function completeReviewRun(runId: string, analysis: ReviewAnalysis) {
  const current = await db.reviewRun.findUnique({ where: { id: runId }, select: { status: true } });
  if (!current || (current.status !== "QUEUED" && current.status !== "RUNNING")) return null;

  return db.reviewRun.update({
    where: { id: runId },
    data: {
      status: analysis.status === "COMPLETED" ? "COMPLETED" : analysis.status,
      outcome: analysis.decision.outcome,
      summary: analysis.summary,
      decisionReasons: analysis.decision.reasons,
      provider: analysis.provider,
      model: analysis.model,
      completedAt: new Date(),
      findings: {
        create: analysis.findings.map((finding) => ({
          category: finding.category,
          severity: finding.severity,
          confidence: finding.confidence,
          title: finding.title,
          description: finding.description,
          filePath: finding.filePath,
          startLine: finding.startLine,
          endLine: finding.endLine,
          evidence: finding.evidence,
          impact: finding.impact,
          suggestedFix: finding.suggestedFix,
          source: finding.source,
          validationStatus: finding.validationStatus,
          fingerprint: findingFingerprint(finding),
        })),
      },
      checks: {
        create: analysis.checks.map((check) => ({
          analyzer: check.analyzer,
          status: check.status,
          required: check.required,
          summary: check.summary,
        })),
      },
    },
  });
}
