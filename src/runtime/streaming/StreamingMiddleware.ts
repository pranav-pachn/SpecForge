import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from '../executor/AgentMiddleware';
import { RuntimeEvents } from '../RuntimeEvents';

import { StreamManager } from './StreamManager';

export class StreamingMiddleware implements AgentMiddleware {
  constructor(private runtimeEvents: RuntimeEvents) {}

  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    
    // Inject a stream handle that the executor can use to emit StreamEvents.
    const streamManager = StreamManager.getInstance();
    context.stream = (event) => streamManager.emit({
      ...event,
      workflowId: context.workflowId,
      agentId: agent.id,
      timestamp: new Date()
    });

    this.runtimeEvents.emitStreamStarted(context.workflowId, agent.id);

    try {
      const result = await next();
      this.runtimeEvents.emitStreamCompleted(context.workflowId, agent.id);
      return result;
    } catch (err) {
      // Stream is also completed (failed)
      this.runtimeEvents.emitStreamCompleted(context.workflowId, agent.id);
      throw err;
    }
  }
}
