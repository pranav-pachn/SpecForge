import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from '../executor/AgentMiddleware';
import { db as prisma } from '@/platform/storage/db';

export class AgentPausedError extends Error {
  constructor(message = 'Agent requires human approval.') {
    super(message);
    this.name = 'AgentPausedError';
  }
}

import { RuntimeEvents } from '../RuntimeEvents';

export class HumanApprovalGate implements AgentMiddleware {
  constructor(private runtimeEvents: RuntimeEvents) {}

  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    
    const requiresApproval = middlewareContext.metadata?.requiresApproval ?? false;

    if (requiresApproval) {
      // 1. Check if there's already an approved request for this run
      const existingRequest = await prisma.approvalRequest.findFirst({
        where: {
          entityId: context.workflowId,
          status: 'APPROVED'
        }
      });

      if (!existingRequest) {
        // 2. We need approval. Create the request and pause.
        await prisma.approvalRequest.create({
          data: {
            entityId: context.workflowId,
            requestedBy: 'system', // or context.userId
          }
        });
        
        // 3. Emit Domain Event
        this.runtimeEvents.emitApprovalRequested(context.workflowId, agent.id);

        // 4. Throw special error to suspend execution
        throw new AgentPausedError();
      }
    }

    return await next();
  }
}
