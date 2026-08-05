import { AgentMetadata } from '../interfaces/AgentMetadata';

export interface MiddlewareContext {
  retryCount: number;
  timeoutMs?: number;
  logs: string[];
  metrics: Record<string, any>;
  metadata?: AgentMetadata;
  // Extensible for future capabilities
  [key: string]: any;
}

export function createMiddlewareContext(): MiddlewareContext {
  return {
    retryCount: 0,
    logs: [],
    metrics: {}
  };
}
