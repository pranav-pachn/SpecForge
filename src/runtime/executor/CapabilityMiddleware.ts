import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';
import { AgentMiddleware, NextMiddleware } from './AgentMiddleware';

export class CapabilityMiddleware implements AgentMiddleware {
  async invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult> {
    console.log(`[CapabilityMiddleware] Checking capabilities for ${agent.name}...`);
    
    // In Phase 3A, we just check that the agent has defined its capabilities.
    // In future phases, this would check `context.userId` or `context.projectId` 
    // against the agent's capabilities using the PolicyEngine or PermissionGuard.
    if (!agent.capabilities || agent.capabilities.length === 0) {
      console.warn(`[CapabilityMiddleware] Warning: Agent ${agent.name} has no declared capabilities.`);
    }

    // Example conceptual check:
    // for (const cap of agent.capabilities) {
    //   if (cap === 'FILESYSTEM_WRITE' && !isLocalEnv()) {
    //     throw new Error(`Capability ${cap} is denied in this environment.`);
    //   }
    // }

    return await next();
  }
}
