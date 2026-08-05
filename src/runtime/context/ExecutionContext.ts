import { CancellationToken } from '../cancellation/CancellationToken';
import { StreamEvent } from '../streaming/StreamManager';


export interface ExecutionContext {
  workflowId: string;
  projectId: string;
  userId: string;
  traceId: string;
  correlationId: string;
  artifacts: Record<string, any>;
  
  // memory: MemoryEngine; // Phase 4 integration
  
  cancellationToken: CancellationToken;
  
  stream?: (event: Omit<StreamEvent, 'workflowId' | 'agentId' | 'timestamp'>) => void;
}
