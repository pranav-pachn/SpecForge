import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';

export class LoggingMiddleware implements AgentMiddleware {
  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    console.log(`[Runtime] Starting execution of Agent: ${agent.name} (${agent.id})`);
    
    try {
      const result = await next();
      
      if (result.errors && result.errors.length > 0) {
        const errorMsg = `[Runtime] Agent ${agent.name} completed with errors: ${result.errors}`;
        console.error(errorMsg);
        middlewareContext.logs.push(errorMsg);
      } else {
        const successMsg = `[Runtime] Agent ${agent.name} completed successfully in ${result.metrics?.durationMs || 0}ms.`;
        console.log(successMsg);
        middlewareContext.logs.push(successMsg);
      }
      
      return result;
    } catch (err) {
      console.error(`[Runtime] Agent ${agent.name} threw an unhandled exception:`, err);
      throw err;
    }
  }
}
