import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class ReviewEvaluator implements Evaluator {
  id = "eval-operational-review";
  name = "Review Quality Evaluator";
  category = "OPERATIONAL" as const;
  weight = 10;

  supportsCapability(capability: Capability): boolean {
    return capability === "REVIEW" || capability === "REVIEW_GATE";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    let score = 100;

    const text = request.artifact.text.trim();
    
    if (text.length < 50 && (text.toLowerCase().includes("looks good") || text.toLowerCase().includes("lgtm"))) {
      findings.push({
        severity: "ERROR",
        message: "Review is superficially positive and lacks critical analysis ('Looks good')."
      });
      score -= 40;
    }

    if (!text.includes("?") && !text.includes("consider") && !text.includes("could")) {
      findings.push({
        severity: "WARN",
        message: "Review does not ask questions or propose alternatives."
      });
      score -= 10;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.8,
      passed: score >= 70,
      findings,
      recommendations: findings.length > 0
        ? ["Provide specific feedback citing exact lines or architectural decisions.", "Do not default to LGTM."]
        : []
    };
  }
}
