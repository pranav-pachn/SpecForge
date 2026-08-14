import { KnowledgeArtifactType } from '../LearningRepository';

export interface CandidateArtifact {
  type: KnowledgeArtifactType | string;
  title: string;
  summary: string;
  confidence: number;
  evidence: any;
  metadata?: any;
}

export class KnowledgeSynthesizer {
  async synthesize(patterns: any[]): Promise<CandidateArtifact[]> {
    console.log(`[KnowledgeSynthesizer] Learning models removed. Skipping synthesis.`);
    return [];
  }
}
