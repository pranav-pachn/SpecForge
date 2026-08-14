import { ExtractionResult } from "../interfaces/ExtractionResult";
import { DecisionScope } from "../EngineeringMemory";

export class DecisionRepository {
  static async createDecision(
    workflowId: string,
    sourceVersionId: string,
    scope: DecisionScope,
    extraction: ExtractionResult
  ) {
    console.log(`[DecisionRepository] Decision models removed. Skipping createDecision.`);
    return { id: "mock-decision-id", decisionId: "DEC-000", workflowId, scope, status: "PENDING", confidence: extraction.confidence };
  }

  static async appendRecord(
    decisionIdInternal: string,
    sourceVersionId: string,
    extraction: ExtractionResult
  ) {
    console.log(`[DecisionRepository] Decision models removed. Skipping appendRecord.`);
    return null;
  }
}
