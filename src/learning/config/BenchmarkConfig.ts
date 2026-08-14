export interface GuardrailConfig {
  maxRegression?: number;
  minRegression?: number;
  catastrophicThreshold?: number; // Used for fail-fast safety abort
}

export interface MetricBenchmarkConfig {
  isPrimary?: boolean;
  lowerIsBetter: boolean;
  minPracticalImprovement: number; // e.g. 0.03 for 3%
  statisticalTest: 'PAIRED_T' | 'WILCOXON' | 'MCNEMAR';
  guardrail?: GuardrailConfig;
}

export const BenchmarkConfig: Record<string, MetricBenchmarkConfig> = {
  validationScore: {
    lowerIsBetter: false,
    minPracticalImprovement: 0.03, // 3%
    statisticalTest: 'PAIRED_T'
  },
  repairCount: {
    lowerIsBetter: true,
    minPracticalImprovement: 0.15, // 15% reduction
    statisticalTest: 'WILCOXON'
  },
  latencyMs: {
    lowerIsBetter: true,
    minPracticalImprovement: 0.05,
    statisticalTest: 'PAIRED_T',
    guardrail: {
      maxRegression: 0.15, // Allow up to 15% regression max
      catastrophicThreshold: 1.0 // 100% regression aborts
    }
  },
  cost: {
    lowerIsBetter: true,
    minPracticalImprovement: 0.05,
    statisticalTest: 'PAIRED_T',
    guardrail: {
      maxRegression: 0.20,
      catastrophicThreshold: 2.0
    }
  },
  securityScore: {
    lowerIsBetter: false,
    minPracticalImprovement: 0.01,
    statisticalTest: 'PAIRED_T',
    guardrail: {
      minRegression: 0.0, // Cannot regress at all
      catastrophicThreshold: 0.05 // Drops of 5% abort
    }
  },
  successRate: {
    lowerIsBetter: false,
    minPracticalImprovement: 0.02,
    statisticalTest: 'MCNEMAR',
    guardrail: {
      minRegression: 0.01,
      catastrophicThreshold: 0.10
    }
  }
};

export const GlobalBenchmarkSettings = {
  defaultConfidenceLevel: 0.95, // 95% confidence
  significanceAlpha: 0.05,      // p < 0.05
  defaultMinRuns: 100,
  defaultTargetRuns: 300,
  defaultMaxRuns: 500
};
