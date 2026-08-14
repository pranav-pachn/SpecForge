export interface LearningStage {
  name: string;
  durationMs: number;
  success: boolean;
}

export interface PromptUsage {
  variantId: string;
  provider: string;
  model: string;
  tokens: number;
  latencyMs: number;
}

export interface LearningFailure {
  stage: string;
  error: string;
  severity: string;
}

export interface LearningSourceProvenance {
  storedEvents: boolean;
  evaluationRun?: string;
  benchmarkResult?: string;
  repairHistory: boolean;
}

export interface LearningExecution {
  id?: string;
  executionId: string;
  workflowId: string;
  startedAt: Date;
  completedAt?: Date;
  success: boolean;
  confidence?: number;
  risk?: string;
  totalDurationMs?: number;
  repairCount: number;
  benchmarkScore?: number;
  stages: LearningStage[];
  failures: LearningFailure[];
  prompts: PromptUsage[];
  source: LearningSourceProvenance;
  schemaVersion: number;
  ingestedAt?: Date;
}
