import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';
import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentResult } from '../interfaces/AgentResult';
import { QuotaManager } from '../resources/QuotaManager';

export class QuotaMiddleware implements AgentMiddleware {
  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    const orgId = request.payload?.organizationId;
    if (orgId) {
      await QuotaManager.checkQuota(orgId, agent.id);
    }
    return next();
  }
}
