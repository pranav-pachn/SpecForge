import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class HallucinationEvaluator implements Evaluator {
  id = "eval-semantic-hallucination";
  name = "Hallucination Evaluator";
  category = "SEMANTIC" as const;
  weight = 25; // High weight

  supportsCapability(capability: Capability): boolean {
    // Hallucination checks apply to almost everything generative
    return capability !== "REVIEW_GATE" && capability !== "CLARIFY";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Cross-reference Output against Context + Graph + Memory.
    // E.g., if Output mentions a technology not present in Context/Memory.
    
    const outputTokens = new Set(request.artifact.text.toLowerCase().match(/\b\w+\b/g) || []);
    
    // Check for a few common technologies that shouldn't appear out of nowhere
    const techKeywords = ["redis", "kafka", "mongodb", "aws", "kubernetes"];
    
    const contextStr = (request.bundle.contextItems?.map(c => c.content).join(" ") || "").toLowerCase();
    const memoryStr = (request.bundle.memory?.map(m => JSON.stringify(m)).join(" ") || "").toLowerCase();
    
    for (const tech of techKeywords) {
      if (outputTokens.has(tech)) {
        if (!contextStr.includes(tech) && !memoryStr.includes(tech)) {
          findings.push({
            severity: "ERROR",
            message: `Artifact references technology '${tech}' which does not exist in Context or Engineering Memory.`
          });
          recommendations.push(`Remove unsupported reference to '${tech}' or formally add it to the architecture.`);
          score -= 30;
        }
      }
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.7,
      passed: score >= 75,
      findings,
      recommendations
    };
  }
}
