import { WorkflowEvent } from '@/workflow/engine/EventBus';
import { DomainEvent } from '../DomainEvent';
import { EventFactory } from '../factory/EventFactory';

export class RuntimeToDomainMapper {
  static map(event: WorkflowEvent): DomainEvent<any> | null {
    const ctx = {
      workflowId: event.workflowId,
      correlationId: (event as any).correlationId || crypto.randomUUID(), // Extract from runtime if available, else new
      causationId: undefined, // Usually null at bridge level
      version: 1
    };

    switch (event.type) {
      case 'PipelineStarted':
        return EventFactory.workflowStarted(event.payload || {}, ctx);
      
      case 'PipelineCompleted':
        return EventFactory.workflowCompleted(event.payload || {}, ctx);
        
      case 'PipelineFailed':
        return EventFactory.workflowFailed(event.payload || {}, ctx);
        
      case 'ApprovalRequested':
        return EventFactory.approvalRequested(event.payload || {}, ctx);

      case 'AgentCompleted':
        if (event.payload?.metrics?.tokensUsed && event.payload.metrics.tokensUsed > 0) {
          return EventFactory.resourceUtilized({
            tokensUsed: event.payload.metrics.tokensUsed,
            agentId: event.agent
          }, ctx);
        }
        return null;

      // Low-level runtime events are deliberately dropped and not converted to Domain Events.
      case 'AgentStarted':
      case 'AgentFailed':
      case 'AgentCancelled':
      case 'AgentPaused':
      case 'AgentResumed':
      case 'RetryStarted':
      case 'StreamStarted':
      case 'StreamCompleted':
        return null;

      default:
        return null;
    }
  }
}
