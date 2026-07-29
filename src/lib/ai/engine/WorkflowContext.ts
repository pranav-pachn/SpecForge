export interface StageRecord {
  agent: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  latencyMs?: number;
  error?: string;
}

export interface WorkflowContext {
  input: {
    workflowId: string;
    userId: string;
    rawIdea: string;
    [key: string]: any; // Additional intake fields
  };
  artifacts: {
    planning?: any;
    clarification?: any;
    specification?: any;
    architecture?: any;
    tasks?: any;
    review?: any;
    validation?: any;
  };
  execution: {
    startedAt: Date;
    stages: StageRecord[];
  };
}
