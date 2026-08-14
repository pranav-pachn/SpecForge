import { LearningExecution } from '@prisma/client';
import { PatternDetectionConfig } from '../config/PatternDetectionConfig';
import { LearningPatternRecord, PatternSeverity } from '../models/LearningPattern';
import crypto from 'crypto';

export class RepairLoopAnalyzer {
  private version = 'v1';
  private detector = 'RepairLoopAnalyzer';

  analyze(executions: LearningExecution[]): LearningPatternRecord[] {
    const patterns: LearningPatternRecord[] = [];
    
    if (executions.length < PatternDetectionConfig.MIN_EXECUTIONS) {
      return patterns;
    }

    // Group repair stats by workflow/stage context. 
    // Since we only have `repairCount` at the workflow level in LearningExecution right now,
    // we'll analyze it at the workflow level.
    // If the user meant stage-level repair loops, we would need to map repairs to stages in the pipeline,
    // but the current schema has `repairCount` on `LearningExecution` directly.
    // Let's also look at `PromptUsage` because it might reflect repairs.
    
    // For Phase 17.2, we'll detect high workflow repair rates.

    const sorted = [...executions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const midPoint = Math.floor(sorted.length / 2);
    
    if (midPoint < Math.max(5, PatternDetectionConfig.MIN_EXECUTIONS / 2)) {
       return patterns;
    }

    const baselineExecs = sorted.slice(0, midPoint);
    const observedExecs = sorted.slice(midPoint);

    const baseAvgRepairs = baselineExecs.length ? baselineExecs.reduce((sum, e) => sum + e.repairCount, 0) / baselineExecs.length : 0;
    const obsAvgRepairs = observedExecs.length ? observedExecs.reduce((sum, e) => sum + e.repairCount, 0) / observedExecs.length : 0;

    const fromWindow = observedExecs[0].ingestedAt;
    const toWindow = observedExecs[observedExecs.length - 1].ingestedAt;

    if (obsAvgRepairs >= PatternDetectionConfig.REPAIR_LOOP.LOW_AVG_LOOPS && obsAvgRepairs > baseAvgRepairs) {
       let severity: PatternSeverity = "LOW";
       if (obsAvgRepairs >= PatternDetectionConfig.REPAIR_LOOP.CRITICAL_AVG_LOOPS) severity = "CRITICAL";
       else if (obsAvgRepairs >= PatternDetectionConfig.REPAIR_LOOP.HIGH_AVG_LOOPS) severity = "HIGH";
       else if (obsAvgRepairs >= PatternDetectionConfig.REPAIR_LOOP.MEDIUM_AVG_LOOPS) severity = "MEDIUM";

       const fingerprint = this.hash(`REPAIR_LOOP:GLOBAL:${this.version}`);
       const difference = obsAvgRepairs - baseAvgRepairs;
       
       const confidence = Math.min(1.0, (observedExecs.length / 50) * 0.5 + (difference / PatternDetectionConfig.REPAIR_LOOP.CRITICAL_AVG_LOOPS) * 0.5);

       patterns.push({
          fingerprint,
          type: "REPAIR_LOOP",
          severity,
          confidence: Number(confidence.toFixed(2)),
          description: `Average repair loops increased from ${baseAvgRepairs.toFixed(1)} to ${obsAvgRepairs.toFixed(1)}.`,
          evidence: {
             sampleSize: observedExecs.length,
             baseline: { avgRepairs: baseAvgRepairs },
             observed: { avgRepairs: obsAvgRepairs },
             difference,
             executionIds: observedExecs.map(e => e.executionId).slice(0, 10),
             analysisWindow: { from: fromWindow, to: toWindow }
          },
          detector: this.detector,
          detectorVersion: this.version
       });
    }

    return patterns;
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
