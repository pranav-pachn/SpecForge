import { AgentRequest } from '../interfaces/AgentRequest';
import { ExecutionGraph } from '../engine/ExecutionGraph';
import { DependencyResolver } from './DependencyResolver';
import { RuntimeRegistry } from '../RuntimeRegistry';

export class Scheduler {
  schedule(request: AgentRequest, agentIds: string[]): ExecutionGraph {
    const registry = RuntimeRegistry.getInstance();
    
    const groups = DependencyResolver.resolve(agentIds, (id) => registry.getMetadata(id));

    return new ExecutionGraph(groups);
  }
}
