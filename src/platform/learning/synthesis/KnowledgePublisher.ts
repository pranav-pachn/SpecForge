import { CandidateArtifact } from './KnowledgeSynthesizer';
import { LearningRepository } from '../LearningRepository';

export class KnowledgePublisher {
  constructor(
    private repository: LearningRepository,
    private eventBus: any
  ) {}

  async publish(candidate: CandidateArtifact) {
    console.log(`[KnowledgePublisher] KnowledgeArtifact models removed. Skipping publish.`);
  }
}
