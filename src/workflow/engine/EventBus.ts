export type EventType = 
  | 'PipelineStarted' 
  | 'AgentStarted' 
  | 'AgentCompleted' 
  | 'AgentFailed' 
  | 'PipelineCompleted' 
  | 'PipelineFailed';

export interface WorkflowEvent {
  type: EventType;
  workflowId: string;
  agent?: string;
  payload?: any;
  timestamp: Date;
}

export class EventBus {
  private listeners: Record<string, ((event: WorkflowEvent) => void)[]> = {};

  emit(event: WorkflowEvent): void {
    const handlers = this.listeners[event.type] || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (err) {
        console.error(`Error in event listener for ${event.type}:`, err);
      }
    });
  }

  on(type: EventType, handler: (event: WorkflowEvent) => void): () => void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(handler);
    
    // Return unsubscribe function
    return () => {
      this.listeners[type] = this.listeners[type].filter(h => h !== handler);
    };
  }
}
