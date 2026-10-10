export interface AnalysisCategory {
  id: string;
  title: string;
  emoji: string;
  weight: number;
  score: number;
  items: AnalysisCheckItem[];
}

export interface AnalysisCheckItem {
  status: 'pass' | 'warn' | 'fail';
  label: string;
  detail?: string;
}

export interface AnalysisIssue {
  severity: 'warning' | 'critical' | 'info';
  category: string;
  title: string;
  description: string;
  linkedRequirementId?: string;
  linkedTaskId?: string;
  recommendation?: string;
}

export interface AnalysisResult {
  categories: AnalysisCategory[];
  overallScore: number;
  issues: AnalysisIssue[];
  generatedAt: Date;
  status?: ValidationStatus;
  vetoReasons?: string[];
}

export interface Analyzer<TContext> {
  analyze(context: TContext): Promise<AnalysisResult>;
}

export type ValidationStatus = "PASSED" | "FAILED" | "INCOMPLETE";

export interface ValidationDecision {
  status: ValidationStatus;
  vetoReasons: string[];
}

/**
 * A numeric score never hides a critical issue, an unlinked finding, or a check that did not run.
 */
export function decideValidationStatus(input: {
  overallScore: number;
  issues: AnalysisIssue[];
  categories: AnalysisCategory[];
  checkErrored?: boolean;
}): ValidationDecision {
  const vetoReasons: string[] = [];

  if (input.checkErrored) {
    vetoReasons.push("A required validation check errored");
  }

  for (const issue of input.issues) {
    if (issue.severity === "critical") {
      vetoReasons.push(`Critical issue: ${issue.title}`);
    }
    if (!issue.linkedRequirementId && !issue.linkedTaskId) {
      vetoReasons.push(`Unlinked finding: ${issue.title}`);
    }
    if (!issue.recommendation) {
      vetoReasons.push(`Finding without a corrective action: ${issue.title}`);
    }
  }

  for (const category of input.categories) {
    const failed = category.items.filter((item) => item.status === "fail");
    if (category.id === "coverage" && failed.length > 0) {
      vetoReasons.push(`Requirement coverage has ${failed.length} failed check(s)`);
    }
  }

  if (input.checkErrored) {
    return { status: "INCOMPLETE", vetoReasons };
  }
  if (vetoReasons.length > 0) {
    return { status: "FAILED", vetoReasons };
  }
  if (input.overallScore >= 80) {
    return { status: "PASSED", vetoReasons: [] };
  }
  return { status: "FAILED", vetoReasons: ["Overall score is below 80"] };
}

export function engineeringReviewStatus(review: {
  overallScore: number;
  categories: Record<string, { items: Array<{ issue?: { priority?: string } }> }>;
}): "READY" | "NEEDS_ATTENTION" {
  const critical = Object.values(review.categories).some((category) =>
    category.items.some((item) => item.issue?.priority === "CRITICAL")
  );
  if (critical || review.overallScore < 80) return "NEEDS_ATTENTION";
  return "READY";
}

export function computeWeightedScore(categories: { weight: number; score: number }[]): number {
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
  if (totalWeight === 0) return 0;
  
  const rawScore = categories.reduce((sum, cat) => sum + (cat.score * cat.weight), 0);
  return Math.round(rawScore / totalWeight);
}
