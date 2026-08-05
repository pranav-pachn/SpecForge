/**
 * Represents a group of agents that can be executed in parallel.
 * Future extension: priority, resource constraints, specific policies per group.
 */
export interface ExecutionGroup {
  id: string;
  agentIds: string[];
  priority?: number;
}

/**
 * An immutable DAG representing the execution plan.
 */
export class ExecutionGraph {
  constructor(
    public readonly groups: ExecutionGroup[]
  ) {}
}
