export type StreamEventType = 'CHUNK' | 'TOKEN' | 'PROGRESS' | 'LOG' | 'TOOL_CALL';

export interface StreamEvent {
  workflowId: string;
  agentId: string;
  type: StreamEventType;
  payload: any;
  timestamp: Date;
}

export type StreamSubscriber = (event: StreamEvent) => void;

/**
 * A transport-agnostic message broker for runtime streaming.
 * Agents emit events, and consumers (SSE, WebSockets, CLI) subscribe.
 */
export class StreamManager {
  private static instance: StreamManager;
  private subscribers: Map<string, StreamSubscriber[]> = new Map();

  private constructor() {}

  public static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  public emit(event: StreamEvent): void {
    const workflowSubs = this.subscribers.get(event.workflowId) || [];
    const globalSubs = this.subscribers.get('*') || [];
    
    for (const sub of [...workflowSubs, ...globalSubs]) {
      try {
        sub(event);
      } catch (err) {
        console.error(`[StreamManager] Subscriber error for workflow ${event.workflowId}:`, err);
      }
    }
  }

  public subscribe(workflowId: string, handler: StreamSubscriber): () => void {
    if (!this.subscribers.has(workflowId)) {
      this.subscribers.set(workflowId, []);
    }
    this.subscribers.get(workflowId)!.push(handler);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(workflowId);
      if (subs) {
        this.subscribers.set(workflowId, subs.filter(h => h !== handler));
      }
    };
  }
}
