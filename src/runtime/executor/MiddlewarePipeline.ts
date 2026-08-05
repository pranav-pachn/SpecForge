import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';
import { MiddlewareContext, createMiddlewareContext } from '../context/MiddlewareContext';
import { RuntimeRegistry } from '../RuntimeRegistry';
import { AgentExecutor } from './AgentExecutor';

export class MiddlewarePipeline {
  private middlewares: AgentMiddleware[] = [];
  private executor: AgentExecutor = new AgentExecutor();

  use(middleware: AgentMiddleware): MiddlewarePipeline {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(agent: Agent, request: AgentRequest, context: ExecutionContext): Promise<AgentResult> {
    const middlewareContext = createMiddlewareContext();
    middlewareContext.metadata = RuntimeRegistry.getInstance().getMetadata(agent.id);

    // Build the middleware chain from the inside out
    let next: NextMiddleware = async () => {
      return this.executor.execute(agent, request, context);
    };

    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const currentMiddleware = this.middlewares[i];
      const nextFn = next;
      next = async () => {
        return currentMiddleware.invoke(agent, request, context, middlewareContext, nextFn);
      };
    }

    return next();
  }
}
