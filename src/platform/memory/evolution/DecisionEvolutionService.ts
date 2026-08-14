export type DecisionStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "ACTIVE" | "SUPERSEDED";
export type EvidenceType = "USER_RESEARCH" | "PERFORMANCE_METRIC" | "LOG_ANALYSIS" | "CODE_REVIEW" | "EXTERNAL_REFERENCE" | "USER_FEEDBACK";

export class DecisionEvolutionService {
  static async recalculateConfidence(decisionIdInternal: string) {
    console.log(`[DecisionEvolutionService] Decision models removed. Skipping recalculateConfidence.`);
    return 0;
  }

  static async approveDecision(decisionIdInternal: string, approvedBy: string) {}

  static async rejectDecision(decisionIdInternal: string, rejectedBy: string, reason: string) {}

  static async addEvidence(
    decisionIdInternal: string,
    type: EvidenceType,
    source: string,
    reference: string,
    addedBy: string = "AI"
  ) {}

  static async supersedeDecision(oldDecisionIdInternal: string, newDecisionIdInternal: string) {}
}
