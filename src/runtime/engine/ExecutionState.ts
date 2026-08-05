export type Transition = 
  | 'CREATED -> SCHEDULED'
  | 'SCHEDULED -> RUNNING'
  | 'RUNNING -> STREAMING'
  | 'STREAMING -> COMPLETED'
  | 'RUNNING -> PAUSED'
  | 'PAUSED -> RUNNING'
  | 'RUNNING -> FAILED'
  | 'RUNNING -> CANCELLED'
  | 'RUNNING -> TIMEOUT'
  | 'RUNNING -> COMPLETED';

export type ExecutionStatus = 'CREATED' | 'SCHEDULED' | 'RUNNING' | 'STREAMING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';

/**
 * Tracks the state of the graph execution separately from the graph definition.
 */
export class ExecutionState {
  public status: ExecutionStatus = 'CREATED';
  public completedAgents: Set<string> = new Set();
  public failedAgents: Set<string> = new Set();
  
  // Future: history of transitions, granular agent states
}
