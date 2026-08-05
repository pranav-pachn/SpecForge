import { AgentCapability } from './AgentCapability';
import { AgentRequest } from './AgentRequest';
import { AgentResult } from './AgentResult';
import { ExecutionContext } from '../context/ExecutionContext';

export interface Agent<TInput = any, TOutput = any> {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AgentCapability[];
  
  execute(
    request: AgentRequest<TInput>, 
    context: ExecutionContext
  ): Promise<AgentResult<TOutput>>;
}
