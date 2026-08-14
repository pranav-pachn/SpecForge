import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class ConsistencyEvaluator implements Evaluator {
  id = "eval-semantic-consistency";
  name = "Consistency Evaluator";
  category = "SEMANTIC" as const;
  weight = 20;

  supportsCapability(capability: Capability): boolean {
    return capability === "ARCHITECTURE" || capability === "EXECUTION";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // A real implementation would use a small LLM call here to cross-reference
    // the artifact text against the specification (passed in request.context).
    // For now, we stub the semantic check.
    
    if (request.artifact.text.includes("TODO") || request.artifact.text.includes("FIXME")) {
      findings.push({
        severity: "WARN",
        message: "Artifact contains unresolved TODO/FIXME statements."
      });
      score -= 15;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.6,
      passed: score >= 80,
      findings,
      recommendations
    };
  }
}
