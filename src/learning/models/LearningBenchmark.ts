import { ExperimentMetrics, ExperimentType } from './LearningExperiment';

export type BenchmarkStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED';
export type BenchmarkResult = 'CONFIRMED' | 'REJECTED' | 'INCONCLUSIVE';

export interface StatisticalResult {
  test: 'PAIRED_T' | 'WILCOXON' | 'MCNEMAR';
  pValue: number;
  confidenceLevel: number;
  effectSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface GuardrailCheck {
  metric: string;
  passed: boolean;
  value: number;
  threshold: number;
  reason?: string;
}

export interface GuardrailResult {
  passed: boolean;
  checks: GuardrailCheck[];
}

export interface PairedObservation {
  inputId: string;
  control: ExperimentMetrics;
  candidate: ExperimentMetrics;
}

export interface LearningBenchmarkRecord {
  id: string;
  recommendationId: string;
  status: BenchmarkStatus;
  datasetId: string;
  datasetVersion: string;
  runCount: number;
  targetRunCount?: number | null;
  controlMetrics?: Record<string, number> | null;
  candidateMetrics?: Record<string, number> | null;
  primaryMetric?: string | null;
  statisticalResult?: StatisticalResult | null;
  guardrailResult?: GuardrailResult | null;
  confidenceLevel?: number | null;
  result?: BenchmarkResult | null;
  error?: string | null;
  fingerprint: string;
}
