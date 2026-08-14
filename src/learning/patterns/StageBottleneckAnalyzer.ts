import { LearningExecution } from '@prisma/client';
import { PatternDetectionConfig } from '../config/PatternDetectionConfig';
import { LearningPatternRecord, PatternSeverity } from '../models/LearningPattern';
import crypto from 'crypto';

export class StageBottleneckAnalyzer {
  private version = 'v1';
  private detector = 'StageBottleneckAnalyzer';

  analyze(executions: LearningExecution[]): LearningPatternRecord[] {
    const patterns: LearningPatternRecord[] = [];
    
    if (executions.length < PatternDetectionConfig.MIN_EXECUTIONS) {
      return patterns;
    }

    // 1. Group stages across executions
    const stageStats: Record<string, { attempts: number, failures: number, durations: number[], executionIds: string[] }> = {};
    
    let fromWindow: Date | null = null;
    let toWindow: Date | null = null;

    for (const exec of executions) {
      if (!fromWindow || exec.ingestedAt < fromWindow) fromWindow = exec.ingestedAt;
      if (!toWindow || exec.ingestedAt > toWindow) toWindow = exec.ingestedAt;

      const stages = exec.stages as any[];
      if (!stages) continue;

      for (const stage of stages) {
        if (!stageStats[stage.name]) {
          stageStats[stage.name] = { attempts: 0, failures: 0, durations: [], executionIds: [] };
        }
        stageStats[stage.name].attempts++;
        if (!stage.success) {
          stageStats[stage.name].failures++;
        }
        if (stage.durationMs > 0) {
          stageStats[stage.name].durations.push(stage.durationMs);
        }
        if (!stageStats[stage.name].executionIds.includes(exec.executionId)) {
           stageStats[stage.name].executionIds.push(exec.executionId);
        }
      }
    }

    // 2. We need baselines to compare against. 
    // In a real system, we'd query historical executions before `fromWindow` for baseline.
    // For this implementation, we will use hardcoded or overall average baselines as placeholders,
    // or we assume the first 50% is baseline and the latter 50% is observed.
    
    // For simplicity in Phase 17.2, we will use an arbitrary baseline if we don't have historical data.
    // But wait, the user requested:
    // "Don't use arbitrary percentages alone ... Instead consider baseline vs observed behavior."
    // Let's divide the dataset chronologically if we have enough data, or assume a baseline.
    
    // Let's sort executions chronologically
    const sorted = [...executions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const midPoint = Math.floor(sorted.length / 2);
    
    if (midPoint < Math.max(5, PatternDetectionConfig.MIN_EXECUTIONS / 2)) {
       // Not enough data to split into baseline and observed.
       return patterns;
    }

    const baselineExecs = sorted.slice(0, midPoint);
    const observedExecs = sorted.slice(midPoint);

    // Calculate Baseline
    const baselineStats: Record<string, { attempts: number, failures: number, durations: number[] }> = {};
    for (const exec of baselineExecs) {
       for (const stage of (exec.stages as any[] || [])) {
          if (!baselineStats[stage.name]) baselineStats[stage.name] = { attempts: 0, failures: 0, durations: [] };
          baselineStats[stage.name].attempts++;
          if (!stage.success) baselineStats[stage.name].failures++;
          if (stage.durationMs > 0) baselineStats[stage.name].durations.push(stage.durationMs);
       }
    }

    // Calculate Observed
    const observedStats: Record<string, { attempts: number, failures: number, durations: number[], executionIds: string[] }> = {};
    for (const exec of observedExecs) {
       for (const stage of (exec.stages as any[] || [])) {
          if (!observedStats[stage.name]) observedStats[stage.name] = { attempts: 0, failures: 0, durations: [], executionIds: [] };
          observedStats[stage.name].attempts++;
          if (!stage.success) observedStats[stage.name].failures++;
          if (stage.durationMs > 0) observedStats[stage.name].durations.push(stage.durationMs);
          if (!observedStats[stage.name].executionIds.includes(exec.executionId)) observedStats[stage.name].executionIds.push(exec.executionId);
       }
    }

    // Compare
    for (const stageName of Object.keys(observedStats)) {
       const base = baselineStats[stageName];
       const obs = observedStats[stageName];

       if (!base || base.attempts < 5 || obs.attempts < 5) continue; // Need minimum attempts per stage

       const baseFailureRate = base.failures / base.attempts;
       const obsFailureRate = obs.failures / obs.attempts;
       
       const baseAvgDuration = base.durations.length ? base.durations.reduce((a,b)=>a+b,0) / base.durations.length : 0;
       const obsAvgDuration = obs.durations.length ? obs.durations.reduce((a,b)=>a+b,0) / obs.durations.length : 0;

       // 1. Detect Failure Bottleneck
       const failureDiff = obsFailureRate - baseFailureRate;
       if (failureDiff >= PatternDetectionConfig.STAGE_FAILURE.LOW_DEVIATION) {
          let severity: PatternSeverity = "LOW";
          if (failureDiff >= PatternDetectionConfig.STAGE_FAILURE.CRITICAL_DEVIATION) severity = "CRITICAL";
          else if (failureDiff >= PatternDetectionConfig.STAGE_FAILURE.HIGH_DEVIATION) severity = "HIGH";
          else if (failureDiff >= PatternDetectionConfig.STAGE_FAILURE.MEDIUM_DEVIATION) severity = "MEDIUM";

          const fingerprint = this.hash(`STAGE_FAILURE_PATTERN:${stageName}:${this.version}`);
          
          // Confidence heuristic based on sample size and difference magnitude
          const confidence = Math.min(1.0, (obs.attempts / 50) * 0.5 + (failureDiff * 2));

          patterns.push({
             fingerprint,
             type: "STAGE_FAILURE_PATTERN",
             severity,
             confidence: Number(confidence.toFixed(2)),
             description: `Stage ${stageName} failure rate increased from ${(baseFailureRate*100).toFixed(1)}% to ${(obsFailureRate*100).toFixed(1)}%.`,
             evidence: {
                sampleSize: obs.attempts,
                baseline: { failureRate: baseFailureRate },
                observed: { failureRate: obsFailureRate },
                difference: failureDiff,
                executionIds: obs.executionIds.slice(0, 10), // Limit array size
                analysisWindow: { from: fromWindow, to: toWindow }
             },
             detector: this.detector,
             detectorVersion: this.version
          });
       }

       // 2. Detect Latency Bottleneck
       if (baseAvgDuration > 0) {
         const latencyMultiplier = obsAvgDuration / baseAvgDuration;
         if (latencyMultiplier >= PatternDetectionConfig.STAGE_LATENCY.LOW_MULTIPLIER) {
            let severity: PatternSeverity = "LOW";
            if (latencyMultiplier >= PatternDetectionConfig.STAGE_LATENCY.CRITICAL_MULTIPLIER) severity = "CRITICAL";
            else if (latencyMultiplier >= PatternDetectionConfig.STAGE_LATENCY.HIGH_MULTIPLIER) severity = "HIGH";
            else if (latencyMultiplier >= PatternDetectionConfig.STAGE_LATENCY.MEDIUM_MULTIPLIER) severity = "MEDIUM";

            const fingerprint = this.hash(`STAGE_LATENCY_PATTERN:${stageName}:${this.version}`);
            
            const confidence = Math.min(1.0, (obs.attempts / 50) * 0.5 + ((latencyMultiplier - 1) * 0.5));

            patterns.push({
               fingerprint,
               type: "STAGE_LATENCY_PATTERN",
               severity,
               confidence: Number(confidence.toFixed(2)),
               description: `Stage ${stageName} average latency increased by ${((latencyMultiplier - 1)*100).toFixed(1)}% (from ${(baseAvgDuration/1000).toFixed(2)}s to ${(obsAvgDuration/1000).toFixed(2)}s).`,
               evidence: {
                  sampleSize: obs.attempts,
                  baseline: { avgDurationMs: baseAvgDuration },
                  observed: { avgDurationMs: obsAvgDuration },
                  difference: latencyMultiplier, // multiplier
                  executionIds: obs.executionIds.slice(0, 10),
                  analysisWindow: { from: fromWindow, to: toWindow }
               },
               detector: this.detector,
               detectorVersion: this.version
            });
         }
       }
    }

    return patterns;
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
