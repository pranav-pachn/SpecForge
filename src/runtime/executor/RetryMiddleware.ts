import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';
import { AgentCancelledError } from '../cancellation/CancellationToken';
import { RetryPolicy, DefaultRetryPolicy } from '../RetryPolicy';

import { RuntimeEvents } from '../RuntimeEvents';

export class RetryMiddleware implements AgentMiddleware {
  constructor(
    private policy: RetryPolicy = DefaultRetryPolicy,
    private runtimeEvents?: RuntimeEvents // Optional for backward compatibility in tests
  ) {}

  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    while (true) {
      try {
        const result = await next();
        
        // Custom result inspection logic (e.g. LLM returned empty array when 10 items expected)
        if (this.policy.shouldRetry && this.policy.shouldRetry(result)) {
           throw new Error('Result failed shouldRetry predicate.');
        }
        
        // By default, if the agent throws an error, it is caught below. 
        // If it successfully returns but contains an error array, we also trigger retry.
        if (result.errors && result.errors.length > 0) {
           throw result.errors[0]; 
        }
        
        return result;
      } catch (err: any) {
        middlewareContext.retryCount++;
        
        // Don't retry cancellations
        if (err instanceof AgentCancelledError) {
          throw err;
        }
        
        if (this.policy.retryOn && !this.policy.retryOn(err)) {
          throw err;
        }

        if (middlewareContext.retryCount > this.policy.maxAttempts) {
          console.error(`[RetryMiddleware] Agent ${agent.name} failed after ${middlewareContext.retryCount} attempts. Giving up.`);
          return {
            errors: [err],
            metrics: { durationMs: 0 }
          };
        }

        let delay = this.policy.baseDelayMs;
        if (this.policy.backoff === 'exponential') {
          delay = this.policy.baseDelayMs * Math.pow(2, middlewareContext.retryCount - 1);
        }
        if (this.policy.jitter) {
          delay += Math.random() * 500;
        }
        
        console.warn(`[RetryMiddleware] Agent ${agent.name} failed (attempt ${middlewareContext.retryCount}/${this.policy.maxAttempts}). Retrying in ${Math.round(delay)}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (this.runtimeEvents) {
          this.runtimeEvents.emitRetryStarted(context.workflowId, agent.id, middlewareContext.retryCount, err as Error);
        }
      }
    }
  }
}
