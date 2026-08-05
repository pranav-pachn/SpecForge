import { Agent } from '../interfaces/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewareContext } from '../context/MiddlewareContext';

export type NextMiddleware = () => Promise<AgentResult>;

export interface AgentMiddleware {
  invoke(
    agent: Agent,
    request: AgentRequest,
    context: ExecutionContext,
    middlewareContext: MiddlewareContext,
    next: NextMiddleware
  ): Promise<AgentResult>;
}
