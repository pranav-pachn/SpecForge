import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class SecurityEvaluator implements Evaluator {
  id = "eval-operational-security";
  name = "Security Evaluator";
  category = "OPERATIONAL" as const;
  weight = 20;

  supportsCapability(capability: Capability): boolean {
    return capability === "ARCHITECTURE" || capability === "EXECUTION";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    let score = 100;

    const text = request.artifact.text;
    
    // Rule-based heuristic check for secrets / bad practices
    const secretRegex = /(api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]+['"]/i;
    
    if (secretRegex.test(text)) {
      findings.push({
        severity: "CRITICAL",
        message: "Potential hardcoded secret or API key detected in output."
      });
      score -= 50;
    }

    if (text.includes("eval(") || text.includes("exec(")) {
      findings.push({
        severity: "WARN",
        message: "Usage of unsafe execution functions (eval/exec) detected."
      });
      score -= 20;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.9,
      passed: score >= 80,
      findings,
      recommendations: findings.length > 0 
        ? ["Remove hardcoded secrets and rely on environment variables.", "Avoid dynamic evaluation functions."] 
        : []
    };
  }
}
