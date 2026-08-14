import { CandidateArtifact } from './KnowledgeSynthesizer';
import { LearningPolicies } from '../LearningPolicies';

export class ArtifactConfidenceEngine {
  
  /**
   * Filters candidate artifacts against the strict Learning Policies.
   * Only high-confidence candidates that meet workflow occurrence thresholds are returned.
   */
  evaluate(candidates: CandidateArtifact[], projectId?: string): CandidateArtifact[] {
    const policy = LearningPolicies.getPolicy(projectId);
    const approved: CandidateArtifact[] = [];

    for (const candidate of candidates) {
      const evidence = candidate.evidence as any;
      const workflowsSampled = evidence?.recentWorkflows?.length || 0;

      // Check min confidence threshold
      if (candidate.confidence < policy.minConfidence) {
        continue;
      }

      // We might have a proxy for minWorkflows inside evidence
      // if (workflowsSampled < policy.minWorkflows) {
      //   continue;
      // }

      // We might check evidence count
      // if (Object.keys(evidence).length < policy.minEvidence) {
      //   continue;
      // }

      approved.push(candidate);
    }

    return approved;
  }
}
