import { LearningExecution } from '@prisma/client';
import { PatternDetectionConfig } from '../config/PatternDetectionConfig';
import { LearningPatternRecord, PatternSeverity } from '../models/LearningPattern';
import crypto from 'crypto';

export class PromptDegradationAnalyzer {
  private version = 'v1';
  private detector = 'PromptDegradationAnalyzer';

  analyze(executions: LearningExecution[]): LearningPatternRecord[] {
    const patterns: LearningPatternRecord[] = [];
    
    // Sort chronologically
    const sorted = [...executions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    const midPoint = Math.floor(sorted.length / 2);
    
    let fromWindow: Date | null = null;
    let toWindow: Date | null = null;

    if (sorted.length > 0) {
      fromWindow = sorted[0].ingestedAt;
      toWindow = sorted[sorted.length - 1].ingestedAt;
    }

    const baselineExecs = sorted.slice(0, midPoint);
    const observedExecs = sorted.slice(midPoint);

    const getPromptStats = (execs: LearningExecution[]) => {
       const stats: Record<string, { attempts: number, success: number, executionIds: string[] }> = {};
       for (const exec of execs) {
          const prompts = exec.prompts as any[];
          if (!prompts) continue;
          for (const p of prompts) {
             if (!stats[p.variantId]) stats[p.variantId] = { attempts: 0, success: 0, executionIds: [] };
             stats[p.variantId].attempts++;
             if (exec.success) stats[p.variantId].success++;
             if (!stats[p.variantId].executionIds.includes(exec.executionId)) stats[p.variantId].executionIds.push(exec.executionId);
          }
       }
       return stats;
    };

    const baseStats = getPromptStats(baselineExecs);
    const obsStats = getPromptStats(observedExecs);

    // 1. PROMPT_DEGRADATION (Same variant, worse performance over time)
    for (const variantId of Object.keys(obsStats)) {
       const obs = obsStats[variantId];
       const base = baseStats[variantId];

       // Requires minimum executions across the board for reliability
       if (!base || base.attempts < (PatternDetectionConfig.MIN_PROMPT_EXECUTIONS / 2) || obs.attempts < (PatternDetectionConfig.MIN_PROMPT_EXECUTIONS / 2)) {
         continue; 
       }

       const baseSuccessRate = base.success / base.attempts;
       const obsSuccessRate = obs.success / obs.attempts;
       const difference = baseSuccessRate - obsSuccessRate;

       if (difference >= PatternDetectionConfig.PROMPT_DEGRADATION.LOW_DEVIATION) {
          let severity: PatternSeverity = "LOW";
          if (difference >= PatternDetectionConfig.PROMPT_DEGRADATION.CRITICAL_DEVIATION) severity = "CRITICAL";
          else if (difference >= PatternDetectionConfig.PROMPT_DEGRADATION.HIGH_DEVIATION) severity = "HIGH";
          else if (difference >= PatternDetectionConfig.PROMPT_DEGRADATION.MEDIUM_DEVIATION) severity = "MEDIUM";

          const fingerprint = this.hash(`PROMPT_DEGRADATION:${variantId}:${this.version}`);
          const confidence = Math.min(1.0, (obs.attempts / 50) * 0.5 + (difference * 2));

          patterns.push({
             fingerprint,
             type: "PROMPT_DEGRADATION",
             severity,
             confidence: Number(confidence.toFixed(2)),
             description: `Prompt variant ${variantId} success rate degraded by ${(difference*100).toFixed(1)}% (from ${(baseSuccessRate*100).toFixed(1)}% to ${(obsSuccessRate*100).toFixed(1)}%).`,
             evidence: {
                sampleSize: obs.attempts + base.attempts,
                baseline: { successRate: baseSuccessRate },
                observed: { successRate: obsSuccessRate },
                difference: -difference, // negative meaning degradation
                executionIds: obs.executionIds.slice(0, 10),
                analysisWindow: { from: fromWindow, to: toWindow }
             },
             detector: this.detector,
             detectorVersion: this.version
          });
       }
    }

    // 2. PROMPT_VARIANT_INFERIOR (Compare two variants in the SAME period)
    const overallStats = getPromptStats(sorted);
    const variants = Object.keys(overallStats);
    
    for (let i = 0; i < variants.length; i++) {
       for (let j = i + 1; j < variants.length; j++) {
          const v1 = variants[i];
          const v2 = variants[j];
          
          const s1 = overallStats[v1];
          const s2 = overallStats[v2];

          if (s1.attempts < PatternDetectionConfig.MIN_PROMPT_EXECUTIONS || s2.attempts < PatternDetectionConfig.MIN_PROMPT_EXECUTIONS) {
             continue;
          }

          const r1 = s1.success / s1.attempts;
          const r2 = s2.success / s2.attempts;
          const diff = Math.abs(r1 - r2);

          if (diff >= PatternDetectionConfig.PROMPT_DEGRADATION.MEDIUM_DEVIATION) { // Only flag if moderately inferior
             const worseVariant = r1 < r2 ? v1 : v2;
             const betterVariant = r1 < r2 ? v2 : v1;
             const worseRate = r1 < r2 ? r1 : r2;
             const betterRate = r1 < r2 ? r2 : r1;

             let severity: PatternSeverity = "LOW";
             if (diff >= PatternDetectionConfig.PROMPT_DEGRADATION.CRITICAL_DEVIATION) severity = "CRITICAL";
             else if (diff >= PatternDetectionConfig.PROMPT_DEGRADATION.HIGH_DEVIATION) severity = "HIGH";
             else if (diff >= PatternDetectionConfig.PROMPT_DEGRADATION.MEDIUM_DEVIATION) severity = "MEDIUM";

             const fingerprint = this.hash(`PROMPT_VARIANT_INFERIOR:${worseVariant}_vs_${betterVariant}:${this.version}`);
             const confidence = Math.min(1.0, ((s1.attempts + s2.attempts) / 100) * 0.5 + (diff * 2));

             patterns.push({
                fingerprint,
                type: "PROMPT_VARIANT_INFERIOR",
                severity,
                confidence: Number(confidence.toFixed(2)),
                description: `Prompt variant ${worseVariant} (${(worseRate*100).toFixed(1)}%) performs significantly worse than ${betterVariant} (${(betterRate*100).toFixed(1)}%).`,
                evidence: {
                   sampleSize: s1.attempts + s2.attempts,
                   baseline: { successRate: betterRate }, // Use better as baseline
                   observed: { successRate: worseRate }, // Use worse as observed
                   difference: -diff,
                   executionIds: [...s1.executionIds.slice(0, 5), ...s2.executionIds.slice(0, 5)],
                   analysisWindow: { from: fromWindow, to: toWindow },
                   worseVariant,
                   betterVariant
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
