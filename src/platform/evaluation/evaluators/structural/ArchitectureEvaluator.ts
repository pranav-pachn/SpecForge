import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class ArchitectureEvaluator implements Evaluator {
  id = "eval-structural-architecture";
  name = "Architecture Evaluator";
  category = "STRUCTURAL" as const;
  weight = 15;

  supportsCapability(capability: Capability): boolean {
    return capability === "ARCHITECTURE";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Rule-based check: Dependency Cycles and Coupling
    // Mocking structural checks on the artifact text/schema
    const text = request.artifact.text.toLowerCase();

    if (text.includes("circular dependency") || text.includes("cyclic")) {
      findings.push({
        severity: "ERROR",
        message: "Potential circular dependencies detected in the architectural proposal."
      });
      recommendations.push("Refactor to remove circular dependencies using interfaces or event-driven patterns.");
      score -= 30;
    }

    if (text.match(/monolith.*microservices/)) {
      findings.push({
        severity: "WARN",
        message: "Mixed monolithic and microservices terminology detected, which may indicate poor cohesion."
      });
      score -= 10;
    }

    // Checking Impact Report if available
    if (request.bundle.graph?.impactReport && request.bundle.graph.impactReport.blastRadius === "CRITICAL") {
      findings.push({
        severity: "CRITICAL",
        message: "Proposed architecture has a CRITICAL blast radius impacting existing core systems."
      });
      score -= 50;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.8,
      passed: score >= 70,
      findings,
      recommendations
    };
  }
}
