import { EvaluationReport } from "../evaluation/reports/EvaluationReport";
import { RepairDiagnosis, RepairStrategy } from "./interfaces";
import { EvaluationResult, EvaluationFinding } from "../evaluation/interfaces/EvaluationResult";

export class RepairDiagnoser {
  static diagnose(report: EvaluationReport, agentId: string): RepairDiagnosis {
    // Collect all failed findings across all evaluators
    const failedFindings = report.results
      .filter((r: EvaluationResult) => !r.passed)
      .flatMap((r: EvaluationResult) => r.findings);

    // In a real system, we'd use an LLM or complex heuristics to map findings to sections.
    // For now, we simulate mapping based on finding content or just target a default section.
    const targetSections = ["Security Requirements", "API Design", "root"];
    
    // Simplistic strategy mapping
    let recommendedStrategy: RepairStrategy = "REWRITE";
    const hasCoverageIssue = failedFindings.some((f: EvaluationFinding) => f.message.toLowerCase().includes("missing") || f.message.toLowerCase().includes("coverage"));
    const hasSecurityIssue = failedFindings.some((f: EvaluationFinding) => f.message.toLowerCase().includes("security") || f.severity === "CRITICAL");
    
    if (hasCoverageIssue) {
      recommendedStrategy = "EXPAND";
    } else if (hasSecurityIssue) {
      recommendedStrategy = "CONSTRAIN";
    }

    return {
      findings: failedFindings,
      targetSections: targetSections.slice(0, 1), // Just target one for simplicity
      recommendedStrategy,
      priority: report.aggregate.riskLevel
    };
  }
}
