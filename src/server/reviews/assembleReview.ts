import { parseUnifiedDiff, isLineInDiff } from "@/server/analysis/diffParser";
import { runStaticChecks } from "@/server/analysis/staticCheck";
import { judgeReview, type ReviewDecision } from "@/server/policy/reviewJudge";
import type { CreateReviewRequest } from "@/shared/schemas/review";
import {
  ReviewFindingSchema,
  dedupeFindings,
  type ReviewFinding,
} from "@/shared/schemas/reviewFinding";
import { ModelReviewSchema, type ModelReview } from "./modelSchema";

export interface AssembledReview {
  summary: string;
  findings: ReviewFinding[];
  decision: ReviewDecision;
  checks: Array<{ analyzer: string; status: "PASSED" | "FAILED" | "SKIPPED" | "ERROR"; required: boolean; summary: string | null }>;
  droppedFindings: number;
}

export class ReviewModelInvalid extends Error {
  constructor() {
    super("Model response did not match the review schema");
    this.name = "ReviewModelInvalid";
  }
}

/**
 * Turns a model object into canonical findings, downgrades anything we cannot
 * tie to the submission, and applies the deterministic judge.
 */
export function assembleReview(input: CreateReviewRequest, modelObject: unknown): AssembledReview {
  const parsed = ModelReviewSchema.safeParse(modelObject);
  if (!parsed.success) throw new ReviewModelInvalid();
  return assembleParsed(input, parsed.data);
}

function assembleParsed(input: CreateReviewRequest, model: ModelReview): AssembledReview {
  const diff = input.kind === "DIFF" ? parseUnifiedDiff(input.content) : null;
  const knownPaths = new Set(
    (diff?.files ?? []).flatMap((file) => [file.newPath, file.oldPath].filter((p): p is string => Boolean(p))),
  );
  const haystack = input.content.toLowerCase();

  let droppedFindings = 0;
  const normalized: ReviewFinding[] = [];

  for (const raw of model.findings) {
    const filePath = raw.filePath && raw.filePath.trim().length > 0 ? raw.filePath : null;
    const startLine = raw.startLine != null && raw.startLine > 0 ? raw.startLine : null;
    const endLine = raw.endLine != null && raw.endLine > 0 ? raw.endLine : null;
    let validationStatus: ReviewFinding["validationStatus"] = "UNVERIFIED";

    const evidenceInInput = raw.evidence.trim().length >= 8 && haystack.includes(raw.evidence.trim().toLowerCase());

    if (diff && filePath && !knownPaths.has(filePath)) {
      validationStatus = "REJECTED";
    } else if (diff && filePath && startLine !== null && !isLineInDiff(diff, filePath, startLine)) {
      validationStatus = "UNVERIFIED";
    } else if (evidenceInInput) {
      validationStatus = "VERIFIED";
    }

    const candidate = {
      ...raw,
      filePath,
      startLine,
      endLine,
      suggestedFix: raw.suggestedFix && raw.suggestedFix.trim().length > 0 ? raw.suggestedFix : null,
      source: "AI" as const,
      validationStatus,
    };
    const checked = ReviewFindingSchema.safeParse(candidate);
    if (!checked.success) {
      droppedFindings += 1;
      continue;
    }
    normalized.push(checked.data);
  }

  const staticResult = runStaticChecks(input);
  const findings = dedupeFindings([...staticResult.findings, ...normalized]);
  const keptFromModel = normalized.filter((finding) => findings.includes(finding)).length;
  droppedFindings += normalized.length - keptFromModel;

  const checks = staticResult.checks;
  const decision = judgeReview({ findings, checks });
  const summary = droppedFindings > 0
    ? `${model.summary} ${droppedFindings} finding(s) were dropped because they failed validation.`
    : model.summary;

  return { summary, findings, decision, checks, droppedFindings };
}
