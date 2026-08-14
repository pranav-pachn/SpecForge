import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class GroundingScoreEvaluator implements Evaluator {
  id = "eval-operational-grounding";
  name = "Grounding Score Evaluator";
  category = "OPERATIONAL" as const;
  weight = 10;

  supportsCapability(capability: Capability): boolean {
    // Grounding makes sense anywhere context is injected
    return true; 
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    let score = 100;

    if (!request.bundle.contextItems || request.bundle.contextItems.length === 0) {
      return {
        evaluatorId: this.id,
        score: 100,
        confidence: 0.2, // Low confidence since there was no context
        passed: true,
        findings: [{ severity: "INFO", message: "No context provided to ground against." }],
        recommendations: []
      };
    }

    // Mock Grounding logic: check what % of context items have keywords that appear in the output
    const outputText = request.artifact.text.toLowerCase();
    let usedContextItems = 0;
    
    for (const item of request.bundle.contextItems) {
      // Very naive check: does a slice of the context appear in the output?
      const snippet = item.content.substring(0, 20).toLowerCase();
      if (outputText.includes(snippet)) {
        usedContextItems++;
      }
    }

    const utilization = usedContextItems / request.bundle.contextItems.length;
    score = Math.round(utilization * 100);

    if (score < 20) {
      findings.push({
        severity: "WARN",
        message: `Only ${score}% of injected context was grounded in the output. The LLM may be ignoring retrieved data.`
      });
    }

    return {
      evaluatorId: this.id,
      score,
      confidence: 0.6,
      passed: score >= 50, // Permissive pass threshold
      findings,
      recommendations: []
    };
  }
}
