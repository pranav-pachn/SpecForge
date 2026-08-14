export type AgentStatus = 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STALE';

export interface AgentEvent {
  agentName: string;
  status: AgentStatus;
  currentAction?: string;
  startedAt?: string;
  latencyMs?: number;
  tokensUsed?: number;
  model?: string;
}

export type WorkflowStage = 'SPECIFICATION' | 'PLANNING' | 'TASKS' | 'EXECUTION' | 'REVIEW' | 'VALIDATION';

export interface StageState {
  stage: WorkflowStage;
  status: AgentStatus;
}
