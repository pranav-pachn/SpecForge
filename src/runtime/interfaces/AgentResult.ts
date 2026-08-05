export interface AgentResult<TOutput = any> {
  readonly output?: TOutput;
  readonly metadata?: Record<string, any>;
  readonly metrics?: {
    durationMs: number;
    tokensUsed?: number;
    [key: string]: any;
  };
  readonly artifacts?: Record<string, any>;
  readonly warnings?: string[];
  readonly errors?: Error[];
}
