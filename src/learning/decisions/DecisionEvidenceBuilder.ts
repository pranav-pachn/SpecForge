import { LearningBenchmark } from '@prisma/client';

export interface DecisionEvidence {
  benchmarks: Array<{
    id: string;
    dataset: string;
    result: string;
  }>;
  primaryMetric: {
    name: string;
    improvement: number;
    pValue: number;
  };
  guardrails: Record<string, 'PASS' | 'FAIL' | 'CATASTROPHIC'>;
}

export class DecisionEvidenceBuilder {
  public build(benchmarks: LearningBenchmark[]): DecisionEvidence {
    if (benchmarks.length === 0) {
      throw new Error('No benchmarks provided for evidence building.');
    }

    const first = benchmarks[0];
    const primaryMetricName = first.primaryMetric || 'unknown';
    
    // Average improvement across all benchmarks
    let totalImprovement = 0;
    let minPValue = 1.0;

    const guardrails: Record<string, 'PASS' | 'FAIL' | 'CATASTROPHIC'> = {};
    const formattedBenchmarks: Array<{ id: string; dataset: string; result: string }> = [];

    for (const b of benchmarks) {
      formattedBenchmarks.push({
        id: b.id,
        dataset: b.datasetId,
        result: b.result || 'UNKNOWN'
      });

      if (b.status === 'ABORTED' && b.error && b.error.includes('Catastrophic regression')) {
         // Parse catastrophic failure from error string if possible, or just mark catastrophic
         guardrails['system'] = 'CATASTROPHIC';
      }

      if (b.statisticalResult) {
        const stat = typeof b.statisticalResult === 'string' ? JSON.parse(b.statisticalResult) : b.statisticalResult as any;
        totalImprovement += (stat.effectSize || 0); // using effect size or improvement
        if (stat.pValue < minPValue) {
           minPValue = stat.pValue;
        }
      }

      if (b.guardrailResult) {
        const guard = typeof b.guardrailResult === 'string' ? JSON.parse(b.guardrailResult) : b.guardrailResult as any;
        for (const check of guard.checks || []) {
           if (!guardrails[check.metric] || guardrails[check.metric] === 'PASS') {
             guardrails[check.metric] = check.passed ? 'PASS' : 'FAIL';
           }
        }
      }
    }

    return {
      benchmarks: formattedBenchmarks,
      primaryMetric: {
        name: primaryMetricName,
        improvement: benchmarks.length > 0 ? totalImprovement / benchmarks.length : 0,
        pValue: minPValue
      },
      guardrails
    };
  }
}
