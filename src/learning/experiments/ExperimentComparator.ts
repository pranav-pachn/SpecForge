import { ExperimentMetrics, ExperimentComparison, ExperimentResult } from '../models/LearningExperiment';

export class ExperimentComparator {
  compare(
    control: ExperimentMetrics,
    candidate: ExperimentMetrics,
    primaryMetric: keyof ExperimentMetrics
  ): { comparison: ExperimentComparison; result: ExperimentResult } {
    
    // Safety check - if one failed entirely on success metric
    if (control.success && !candidate.success) {
      return this.buildResult(control, candidate, primaryMetric, 'REGRESSED', -1);
    }
    if (!control.success && candidate.success) {
      return this.buildResult(control, candidate, primaryMetric, 'IMPROVED', 1);
    }

    const controlVal = (control[primaryMetric] as number) || 0;
    const candidateVal = (candidate[primaryMetric] as number) || 0;

    let improvement = 0;
    
    // Determine if higher is better or lower is better
    const lowerIsBetter = ['latencyMs', 'tokens', 'repairCount', 'estimatedCost', 'failureRate'].includes(primaryMetric as string);

    if (controlVal !== 0) {
       improvement = lowerIsBetter 
        ? (controlVal - candidateVal) / controlVal 
        : (candidateVal - controlVal) / controlVal;
    } else {
       // if control was 0, it's tricky. Let's just say difference
       improvement = lowerIsBetter ? (controlVal - candidateVal) : (candidateVal - controlVal);
    }

    // Thresholds for significance (this could be configurable later)
    const SIGNIFICANCE_THRESHOLD = 0.02; // 2% change minimum to call it improved/regressed

    let result: ExperimentResult = 'INCONCLUSIVE';
    if (improvement > SIGNIFICANCE_THRESHOLD) {
      result = 'IMPROVED';
    } else if (improvement < -SIGNIFICANCE_THRESHOLD) {
      result = 'REGRESSED';
    }

    return this.buildResult(control, candidate, primaryMetric, result, improvement);
  }

  private buildResult(
    control: ExperimentMetrics,
    candidate: ExperimentMetrics,
    primaryMetric: keyof ExperimentMetrics,
    result: ExperimentResult,
    improvement: number
  ) {
    const secondaryMetrics: Record<string, number> = {};
    const keys: (keyof ExperimentMetrics)[] = ['correctness', 'validation', 'repairCount', 'latencyMs', 'tokens'];
    
    for (const key of keys) {
      if (key !== primaryMetric && control[key] !== undefined && candidate[key] !== undefined) {
         const lowerIsBetter = ['latencyMs', 'tokens', 'repairCount', 'estimatedCost', 'failureRate'].includes(key as string);
         const cVal = (control[key] as number) || 0;
         const candVal = (candidate[key] as number) || 0;
         
         if (cVal !== 0) {
            secondaryMetrics[key as string] = lowerIsBetter ? (cVal - candVal) / cVal : (candVal - cVal) / cVal;
         }
      }
    }

    const comparison: ExperimentComparison = {
      primaryMetric: primaryMetric as string,
      improvement,
      secondaryMetrics
    };

    return { comparison, result };
  }
}
