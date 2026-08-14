export enum JobType {
  AGENT = "AGENT",
  EVALUATION = "EVALUATION",
  INDEXING = "INDEXING",
  MEMORY = "MEMORY",
  MCP = "MCP",
  GRAPH = "GRAPH",
  AUTONOMOUS_EXECUTION = "AUTONOMOUS_EXECUTION",
  BENCHMARK = "BENCHMARK",
}

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 5,
  NORMAL = 10,
  LOW = 20,
}

export interface RuntimeJob {
  id: string;
  workflowId: string;
  executionId?: string;
  graphId?: string;
  nodeId?: string;
  type: JobType | string;
  priority: JobPriority | number;
  payload: Record<string, unknown>;
  retryPolicy?: { maxAttempts: number; backoffMs: number };
  metadata?: Record<string, unknown>;
}
