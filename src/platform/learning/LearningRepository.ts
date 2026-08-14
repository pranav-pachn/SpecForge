export type KnowledgeArtifactType = "DECISION_TEMPLATE" | "PATTERN_RULE" | "CODE_SNIPPET" | "ARCHITECTURE_GUIDELINE";

export class LearningRepository {
  async savePattern(type: string, confidence: number, occurrences: number, evidence: any, metadata: any = {}) {
    return null;
  }

  async getRecentPatterns(limit: number = 50) {
    return [];
  }

  async saveKnowledgeArtifact(data: {
    type: KnowledgeArtifactType;
    title: string;
    summary: string;
    confidence: number;
    evidence: any;
    metadata?: any;
    supersedesId?: string;
  }) {
    return null;
  }

  async getArtifactsByType(type: KnowledgeArtifactType) {
    return [];
  }

  async supersedeArtifact(oldArtifactId: string, newArtifactId: string) {
    return null;
  }
}
