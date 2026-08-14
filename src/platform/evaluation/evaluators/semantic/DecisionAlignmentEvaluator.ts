import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class DecisionAlignmentEvaluator implements Evaluator {
  id = "eval-semantic-alignment";
  name = "Decision Alignment";
  category = "SEMANTIC" as const;
  weight = 30; // Very high weight: past decisions are binding

  supportsCapability(capability: Capability): boolean {
    return capability === "ARCHITECTURE" || capability === "EXECUTION";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    if (!request.bundle.memory || request.bundle.memory.length === 0) {
      return {
        evaluatorId: this.id,
        score: 100,
        confidence: 0.5,
        passed: true,
        findings: [{ severity: "INFO", message: "No past decisions to align against." }],
        recommendations: []
      };
    }

    // Mock alignment logic
    const text = request.artifact.text.toLowerCase();
    
    // Imagine request.bundle.memory contains { decision: "Use Postgres", reason: "ACID" }
    // If output says "We will use MongoDB", it violates memory.
    
    if (text.includes("mongodb") && JSON.stringify(request.bundle.memory).toLowerCase().includes("postgres")) {
      findings.push({
        severity: "CRITICAL",
        message: "Architectural choice (MongoDB) contradicts recorded decision (Postgres)."
      });
      recommendations.push("Align architecture with historical decisions in Engineering Memory, or formally propose a migration.");
      score -= 60;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.9,
      passed: score >= 80,
      findings,
      recommendations
    };
  }
}
