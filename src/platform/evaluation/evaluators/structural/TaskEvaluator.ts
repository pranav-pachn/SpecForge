import { Evaluator } from "../../interfaces/Evaluator";
import { EvaluationRequest } from "../../interfaces/EvaluationRequest";
import { EvaluationResult, EvaluationFinding } from "../../interfaces/EvaluationResult";
import { Capability } from "../../../ai/interfaces/Capability";

export class TaskEvaluator implements Evaluator {
  id = "eval-structural-task";
  name = "Task Completeness Evaluator";
  category = "STRUCTURAL" as const;
  weight = 15;

  supportsCapability(capability: Capability): boolean {
    return capability === "TASK_PLANNING";
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationResult> {
    const findings: EvaluationFinding[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Basic heuristic: Ensure generated tasks actually look like actionable items
    const lines = request.artifact.text.split('\n');
    const taskCount = lines.filter(l => l.match(/^- \[ \]|- /)).length;

    if (taskCount === 0) {
      findings.push({
        severity: "ERROR",
        message: "No actionable tasks found in the output."
      });
      score = 0;
    } else if (taskCount < 3) {
      findings.push({
        severity: "WARN",
        message: "Very few tasks generated. Verify that the breakdown is sufficiently detailed."
      });
      score -= 20;
    }

    return {
      evaluatorId: this.id,
      score: Math.max(0, score),
      confidence: 0.7,
      passed: score >= 80,
      findings,
      recommendations
    };
  }
}
