import { AgentResult } from './interfaces/AgentResult';

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  baseDelayMs: number;
  jitter: boolean;
  
  // Optional predicates to decide whether to retry
  retryOn?: (error: Error) => boolean;
  shouldRetry?: (result: AgentResult) => boolean;
}

export const DefaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  backoff: 'exponential',
  baseDelayMs: 1000,
  jitter: true,
};
