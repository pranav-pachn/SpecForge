import { EvaluationRequest } from "./interfaces/EvaluationRequest";
import { EvaluationReport } from "./reports/EvaluationReport";
import { evaluatorRegistry } from "./registry/EvaluatorRegistry";
import { ConfidenceAggregator } from "./aggregation/ConfidenceAggregator";
import { EvaluationResult } from "./interfaces/EvaluationResult";

export class EvaluationEngine {
  private aggregator: ConfidenceAggregator;

  constructor() {
    this.aggregator = new ConfidenceAggregator(evaluatorRegistry);
  }

  async evaluate(request: EvaluationRequest): Promise<EvaluationReport> {
    const evaluators = evaluatorRegistry.getSupporting(request.capability);
    
    if (evaluators.length === 0) {
      console.warn(`[EvaluationEngine] No evaluators found for capability: ${request.capability}`);
      return {
        id: crypto.randomUUID(),
        workflowId: request.workflowId,
        capability: request.capability,
        results: [],
        aggregate: { overall: 0, passed: true, riskLevel: "LOW", breakdown: {} },
        recommendations: [],
        evaluatedAt: new Date()
      };
    }

    // Run all supporting evaluators in parallel
    const promises = evaluators.map(async (evaluator) => {
      try {
        const start = Date.now();
        const result = await evaluator.evaluate(request);
        result.executionTime = Date.now() - start;
        return result;
      } catch (error: any) {
        console.error(`[EvaluationEngine] Evaluator ${evaluator.id} failed:`, error);
        // Return a mock result to prevent failing the whole engine
        return {
          evaluatorId: evaluator.id,
          score: 0,
          confidence: 0,
          passed: false,
          findings: [{ severity: "ERROR", message: `Evaluator failed: ${error.message}` }],
          recommendations: []
        } as EvaluationResult;
      }
    });

    const results = await Promise.all(promises);

    // Aggregate results
    const aggregate = this.aggregator.aggregate(results);

    return {
      id: crypto.randomUUID(),
      workflowId: request.workflowId,
      capability: request.capability,
      results,
      aggregate: {
        overall: aggregate.overall,
        passed: aggregate.passed,
        riskLevel: aggregate.riskLevel,
        breakdown: aggregate.breakdown
      },
      recommendations: aggregate.recommendations,
      evaluatedAt: new Date()
    };
  }
}

export const evaluationEngine = new EvaluationEngine();
