import { ExecutionContext } from '../context/ExecutionContext';

export interface ExecutionSnapshot {
  readonly snapshotVersion: number;
  readonly workflowId: string;
  readonly completedAgents: string[];
  readonly artifacts: Record<string, any>;
  // Future: variables, memoryRefs
}

export function createSnapshot(
  context: ExecutionContext,
  completedAgents: string[]
): ExecutionSnapshot {
  return Object.freeze({
    snapshotVersion: 1,
    workflowId: context.workflowId,
    completedAgents: [...completedAgents],
    artifacts: JSON.parse(JSON.stringify(context.artifacts)), // deep copy to ensure immutability
  });
}
