import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';

export class AgentTimeoutError extends Error {
  constructor(message = 'Agent execution timed out.') {
    super(message);
    this.name = 'AgentTimeoutError';
  }
}

export class TimeoutMiddleware implements AgentMiddleware {
  // Configurable default timeout (e.g. 5 minutes)
  constructor(private defaultTimeoutMs: number = 300000) {}

  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    const timeoutMs = middlewareContext.timeoutMs || this.defaultTimeoutMs;

    return Promise.race([
      next(),
      new Promise<AgentResult>((_, reject) =>
        setTimeout(() => reject(new AgentTimeoutError(`Agent ${agent.name} timed out after ${timeoutMs}ms.`)), timeoutMs)
      )
    ]);
  }
}
