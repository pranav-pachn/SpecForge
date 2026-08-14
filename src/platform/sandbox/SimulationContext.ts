import { Workspace } from '../autonomous/WorkspaceManager';

export interface WorkflowSnapshot {
  id: string;
  requirements: any;
  specification: any;
  tasks: any[];
}

export interface SimulationContext {
  mode: 'SIMULATION'; // ExecutionMode enum equivalent
  workspace: Workspace;
  workflowSnapshot: WorkflowSnapshot;
  graphSnapshot: any; // A representation of the KnowledgeGraph for this workflow
  memorySnapshot: any; // State of MemoryNodes
  promptBundleSnapshot: any; // The frozen prompt variants
  evaluationPolicySnapshot: any; // E.g., threshold config frozen in time
}
