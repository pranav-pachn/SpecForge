import { AgentMetadata } from '../interfaces/AgentMetadata';
import { ExecutionGroup } from '../engine/ExecutionGraph';

export class CircularDependencyError extends Error {
  constructor(message = 'Circular dependency detected in execution graph.') {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

export class DependencyResolver {
  static resolve(agentIds: string[], getMetadata: (id: string) => AgentMetadata): ExecutionGroup[] {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize all agents in the input
    for (const id of agentIds) {
      adj.set(id, []);
      inDegree.set(id, 0);
    }

    // Build the graph
    for (const id of agentIds) {
      const meta = getMetadata(id);
      const dependencies = meta.dependencies || [];
      
      for (const dep of dependencies) {
        if (!agentIds.includes(dep)) continue; // ignore external dependencies not in this run
        
        if (!adj.has(dep)) adj.set(dep, []);
        adj.get(dep)!.push(id);
        
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      }
    }

    const groups: ExecutionGroup[] = [];
    let processedCount = 0;

    // We process the graph wave by wave to maximize parallel execution
    while (true) {
      const currentWave: string[] = [];
      
      for (const [id, degree] of Array.from(inDegree.entries())) {
        if (degree === 0) {
          currentWave.push(id);
        }
      }

      if (currentWave.length === 0) {
        break; // No more nodes with inDegree 0
      }

      groups.push({
        id: `group-${groups.length + 1}`,
        agentIds: currentWave,
        priority: 0
      });

      processedCount += currentWave.length;

      // Remove current wave from graph
      for (const id of currentWave) {
        inDegree.delete(id);
        for (const neighbor of adj.get(id) || []) {
          if (inDegree.has(neighbor)) {
            inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
          }
        }
      }
    }

    if (processedCount < agentIds.length) {
      throw new CircularDependencyError(`Circular dependency detected involving agents: ${Array.from(inDegree.keys()).join(', ')}`);
    }

    return groups;
  }
}
