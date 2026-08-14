import { LearningBenchmark } from '@prisma/client';
import { DecisionPolicyConfig, DecisionConfig } from '../config/DecisionConfig';

export type DecisionStatus = 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW';

export class RulesetEvaluator {
  public evaluate(
    benchmarks: LearningBenchmark[],
    policyName: string
  ): { decision: DecisionStatus; rationale: string; policy: string } {
    
    const policy = DecisionConfig[policyName];
    if (!policy) {
      throw new Error(`Unknown policy: ${policyName}`);
    }

    if (benchmarks.length === 0) {
      return {
        decision: 'NEEDS_REVIEW',
        rationale: 'Insufficient datasets: 0 benchmarks provided.',
        policy: policyName
      };
    }

    let confirmedCount = 0;
    let rejectedCount = 0;
    let inconclusiveCount = 0;
    let abortedCount = 0;
    let hasCriticalRegression = false;

    // We consider unique datasets. If a dataset was run multiple times, we'd group them,
    // but here we assume each benchmark in the array represents a distinct dataset evaluation run.
    const uniqueDatasets = new Set(benchmarks.map(b => b.datasetId)).size;

    for (const b of benchmarks) {
      if (b.status === 'ABORTED') abortedCount++;
      
      if (b.result === 'CONFIRMED') confirmedCount++;
      else if (b.result === 'REJECTED') rejectedCount++;
      else if (b.result === 'INCONCLUSIVE') inconclusiveCount++;
      
      if (b.error && b.error.includes('Catastrophic regression')) {
         hasCriticalRegression = true;
      }
    }

    // 1. REJECT CONDITIONS
    if (abortedCount > 0 || hasCriticalRegression) {
       return {
         decision: 'REJECTED',
         rationale: 'Critical regression detected causing benchmark abort.',
         policy: policyName
       };
    }

    if (rejectedCount > policy.maximumRejectedBenchmarks) {
       return {
         decision: 'REJECTED',
         rationale: `Rejected datasets (${rejectedCount}) exceeded maximum allowed (${policy.maximumRejectedBenchmarks}).`,
         policy: policyName
       };
    }

    // 2. REVIEW CONDITIONS
    if (uniqueDatasets < policy.minimumConfirmedBenchmarks) {
       return {
         decision: 'NEEDS_REVIEW',
         rationale: `Insufficient independent datasets tested (${uniqueDatasets} < ${policy.minimumConfirmedBenchmarks}).`,
         policy: policyName
       };
    }

    if (confirmedCount < policy.minimumConfirmedBenchmarks) {
       return {
         decision: 'NEEDS_REVIEW',
         rationale: `Insufficient confirmed datasets (${confirmedCount} < ${policy.minimumConfirmedBenchmarks}).`,
         policy: policyName
       };
    }

    if (inconclusiveCount > 0 && policy.inconclusiveRequiresHumanReview) {
       return {
         decision: 'NEEDS_REVIEW',
         rationale: `Mixed results: ${inconclusiveCount} dataset(s) yielded inconclusive results.`,
         policy: policyName
       };
    }

    // 3. ACCEPT CONDITIONS
    return {
       decision: 'ACCEPTED',
       rationale: `Candidate demonstrated statistically significant and practically meaningful improvement across ${confirmedCount} dataset(s) without violating guardrails.`,
       policy: policyName
    };
  }
}
