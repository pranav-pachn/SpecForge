export interface PromptHypothesis {
  description: string;
  variables: string[];
  expectedMetric: string;
  expectedDelta: number;
  confidence: number;
}

export interface ExperimentPlan {
  hypothesis: PromptHypothesis;
  candidateCount: number;
  benchmarkSuite: string;
  benchmarkProfile: string;
}
