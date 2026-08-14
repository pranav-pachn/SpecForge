import { PairedObservation, GuardrailResult, GuardrailCheck } from '../models/LearningBenchmark';
import { BenchmarkConfig } from '../config/BenchmarkConfig';

export class SafetyEvaluator {
  public evaluate(
    observations: PairedObservation[],
    primaryMetric: string
  ): GuardrailResult {
    
    const checks: GuardrailCheck[] = [];
    let allPassed = true;

    // We check all configured metrics except the primary metric
    const keys = Object.keys(BenchmarkConfig).filter(k => k !== primaryMetric);

    for (const key of keys) {
      const config = BenchmarkConfig[key].guardrail;
      if (!config) continue;

      let controlSum = 0;
      let candidateSum = 0;
      
      for (const obs of observations) {
        controlSum += (obs.control as any)[key] || 0;
        candidateSum += (obs.candidate as any)[key] || 0;
      }

      const controlMean = controlSum / observations.length;
      const candidateMean = candidateSum / observations.length;

      let improvement = 0;
      if (controlMean !== 0) {
        improvement = BenchmarkConfig[key].lowerIsBetter
          ? (controlMean - candidateMean) / controlMean
          : (candidateMean - controlMean) / controlMean;
      }

      // Regression is just negative improvement
      const regression = -improvement;
      
      let passed = true;
      let reason: string | undefined;

      if (config.maxRegression !== undefined && regression > config.maxRegression) {
        passed = false;
        reason = `Regression (${(regression * 100).toFixed(1)}%) exceeded max allowed (${(config.maxRegression * 100).toFixed(1)}%)`;
      }

      if (config.minRegression !== undefined && regression > config.minRegression) {
         passed = false;
         reason = `Regression (${(regression * 100).toFixed(1)}%) exceeded min allowed (${(config.minRegression * 100).toFixed(1)}%)`;
      }

      checks.push({
        metric: key,
        passed,
        value: regression,
        threshold: config.maxRegression ?? config.minRegression ?? 0,
        reason
      });

      if (!passed) allPassed = false;
    }

    return {
      passed: allPassed,
      checks
    };
  }

  public checkCatastrophic(
    observation: PairedObservation,
    primaryMetric: string
  ): { aborted: boolean; reason?: string } {
     
     for (const key of Object.keys(BenchmarkConfig)) {
        const config = BenchmarkConfig[key].guardrail;
        if (!config?.catastrophicThreshold) continue;

        const c = (observation.control as any)[key] || 0;
        const t = (observation.candidate as any)[key] || 0;

        let improvement = 0;
        if (c !== 0) {
           improvement = BenchmarkConfig[key].lowerIsBetter ? (c - t) / c : (t - c) / c;
        }

        const regression = -improvement;

        if (regression >= config.catastrophicThreshold) {
           return {
              aborted: true,
              reason: `Catastrophic regression on ${key}: ${(regression * 100).toFixed(1)}%`
           };
        }
     }

     return { aborted: false };
  }
}
