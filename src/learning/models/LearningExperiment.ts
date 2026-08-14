export type ExperimentStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED';
export type ExperimentType = 'PROMPT' | 'WORKFLOW' | 'EXECUTION';
export type ExperimentResult = 'IMPROVED' | 'REGRESSED' | 'INCONCLUSIVE';

export interface ExperimentMetrics {
  success: boolean;
  correctness?: number;
  validation?: number;
  confidence?: number;
  repairCount?: number;
  repairSuccessRate?: number;
  latencyMs?: number;
  tokens?: number;
  estimatedCost?: number;
  failureRate?: number;
}

export interface ExperimentComparison {
  primaryMetric: string;
  improvement: number; // positive = better
  secondaryMetrics: Record<string, number>;
}

export interface LearningExperimentRecord {
  recommendationId: string;
  status: ExperimentStatus;
  experimentType: ExperimentType;
  targetWorkflowId?: string;
  testExecutionId?: string;
  controlMetrics?: ExperimentMetrics;
  candidateMetrics?: ExperimentMetrics;
  comparison?: ExperimentComparison;
  primaryMetric?: string;
  result?: ExperimentResult;
  error?: string;
  fingerprint: string;
}
