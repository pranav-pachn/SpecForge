import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class CoverageEvaluator implements Evaluator {
  id = "eval-structural-coverage";
  name = "Coverage Evaluator";
  category = "STRUCTURAL" as const;
  weight = 25;

  supportsCapability(capability: Capability): boolean {
    return capability === "ARCHITECTURE" || capability === "TASK_PLANNING";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    let score = 100;
    
    // Coverage evaluator uses graph reports injected into the bundle
    if (request.bundle.graph?.coverageReport) {
      const report = request.bundle.graph.coverageReport;
      
      if (report.requirements === 0) {
        return {
          evaluatorId: this.id,
          score: 100,
          confidence: 1,
          passed: true,
          findings: [],
          recommendations: []
        };
      }

      const coverageRatio = report.covered / report.requirements;
      score = coverageRatio * 100;

      if (report.uncovered.length > 0) {
        findings.push({
          severity: "ERROR",
          message: `${report.uncovered.length} requirements have no coverage in the architecture or tasks.`
        });
      }

      if (report.partial > 0) {
        findings.push({
          severity: "WARN",
          message: `${report.partial} requirements are only partially covered.`
        });
      }
    } else {
      findings.push({
        severity: "INFO",
        message: "No coverage report available for this evaluation."
      });
    }

    return {
      evaluatorId: this.id,
      score: Math.round(score),
      confidence: request.bundle.graph?.coverageReport ? 0.9 : 0.1,
      passed: score >= 80,
      findings,
      recommendations: findings.length > 0 
        ? ["Ensure all requirements from the specification are mapped to architectural components and tasks."]
        : []
    };
  }
}
