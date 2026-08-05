import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { AgentCancelledError } from '../cancellation/CancellationToken';

export class AgentExecutor {
  async execute(agent: Agent, request: AgentRequest, context: ExecutionContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      context.cancellationToken.throwIfCancelled();
      
      const result = await agent.execute(request, context);
      
      const durationMs = Date.now() - startTime;
      
      return {
        ...result,
        metrics: {
          ...result.metrics,
          durationMs
        }
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      
      if (error instanceof AgentCancelledError) {
        throw error;
      }
      
      // Wrap unexpected errors
      return {
        errors: [error],
        metrics: {
          durationMs
        }
      };
    }
  }
}
