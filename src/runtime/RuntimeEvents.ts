import { EventBus } from '../workflow/engine/EventBus';

export class RuntimeEvents {
  constructor(private eventBus: EventBus) {}

  emitAgentStarted(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'AgentStarted', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitAgentCompleted(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'AgentCompleted', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitAgentFailed(workflowId: string, agentId: string, error: Error, durationMs?: number) {
    this.eventBus.emit({ type: 'AgentFailed', workflowId, agent: agentId, payload: { error: error.message, durationMs }, timestamp: new Date() });
  }

  emitAgentPaused(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'AgentPaused', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitAgentResumed(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'AgentResumed', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitApprovalRequested(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'ApprovalRequested', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitAgentCancelled(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'AgentCancelled', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitRetryStarted(workflowId: string, agentId: string, attempt: number, error: any) {
    this.eventBus.emit({ type: 'RetryStarted', workflowId, agent: agentId, payload: { attempt, error }, timestamp: new Date() });
  }

  emitStreamStarted(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'StreamStarted', workflowId, agent: agentId, timestamp: new Date() });
  }

  emitStreamCompleted(workflowId: string, agentId: string) {
    this.eventBus.emit({ type: 'StreamCompleted', workflowId, agent: agentId, timestamp: new Date() });
  }
}
