import { PatternDetector } from './extractors/PatternDetector';
import { KnowledgeSynthesizer } from './synthesis/KnowledgeSynthesizer';
import { ArtifactConfidenceEngine } from './synthesis/ArtifactConfidenceEngine';
import { KnowledgePublisher } from './synthesis/KnowledgePublisher';
import { LessonExtractor } from './extractors/LessonExtractor';

export class LearningOrchestrator {
  private extractors: LessonExtractor[] = [];
  
  constructor(
    private patternDetector: PatternDetector,
    private synthesizer: KnowledgeSynthesizer,
    private confidenceEngine: ArtifactConfidenceEngine,
    private publisher: KnowledgePublisher
  ) {}

  registerExtractor(extractor: LessonExtractor) {
    this.extractors.push(extractor);
  }

  async processWorkflow(workflowId: string, projectId?: string) {
    console.log(`[LearningOrchestrator] Telemetry and Learning models removed. Skipping orchestration for ${workflowId}`);
  }
}
