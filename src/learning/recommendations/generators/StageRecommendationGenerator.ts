import { LearningPattern } from '@prisma/client';
import { LearningRecommendationRecord, ProposedChange } from '../../models/LearningRecommendation';
import crypto from 'crypto';

export class StageRecommendationGenerator {
  private version = 'v1';
  private generator = 'StageRecommendationGenerator';

  async generate(pattern: LearningPattern): Promise<LearningRecommendationRecord[]> {
    const recommendations: LearningRecommendationRecord[] = [];
    
    if (pattern.type === 'STAGE_FAILURE_PATTERN' || pattern.type === 'STAGE_LATENCY_PATTERN') {
      const stageName = pattern.fingerprint.split(':')[1] || 'unknown-stage';
      
      const proposedChange: ProposedChange = {
        action: 'INVESTIGATE_STAGE',
        target: {
          type: 'stage',
          id: stageName
        },
        candidate: {
          configuration: {
            investigate: [
              'optimize context size',
              'change chunk size',
              'adjust timeout',
              'evaluate provider'
            ]
          }
        }
      };

      const fingerprint = this.hash(`${pattern.id}:${this.generator}:${this.version}:INVESTIGATE:${stageName}`);

      const problem = pattern.type === 'STAGE_FAILURE_PATTERN' ? 'failure rate' : 'latency';

      recommendations.push({
        patternId: pattern.id,
        type: 'INVESTIGATION',
        status: 'PROPOSED',
        proposedChange,
        rationale: `Stage ${stageName} has shown significant ${problem} issues. A root cause investigation is recommended before modifying configurations.`,
        expectedImpact: 'Identify bottleneck without masking underlying RAG/API issues.',
        confidence: pattern.confidence - 0.1, // High confidence in the need to investigate
        evidence: pattern.evidence,
        generator: this.generator,
        generatorVersion: this.version,
        fingerprint
      });
    }

    return recommendations;
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
