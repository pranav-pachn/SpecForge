import { GraphNode, GraphEdge } from "../graph/NodeTypes";

type GraphEventType = 
  | "NODE_CREATED" 
  | "NODE_UPDATED" 
  | "NODE_DELETED"
  | "EDGE_CREATED" 
  | "EDGE_REMOVED"
  | "WORKFLOW_COMPLETED"
  | "DRIFT_DETECTED";

interface GraphEventPayload {
  workflowId: string;
  node?: GraphNode;
  edge?: GraphEdge;
  timestamp: Date;
  metadata?: Record<string, any>;
}

type EventListener = (payload: GraphEventPayload) => Promise<void> | void;

/**
 * Event-Driven Backbone for Engineering Intelligence.
 * Enables reactive systems (like Memory Capture, Impact Analysis) to trigger asynchronously.
 */
export class IntelligenceEventBus {
  private static listeners: Record<string, EventListener[]> = {};

  static subscribe(event: GraphEventType, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  static async emit(event: GraphEventType, payload: GraphEventPayload) {
    const eventListeners = this.listeners[event] || [];
    
    // Non-blocking fire-and-forget for listeners
    // Alternatively, we could await them if strict consistency is needed, 
    // but typically event buses in this context are background tasks.
    for (const listener of eventListeners) {
      Promise.resolve(listener(payload)).catch(err => {
        console.error(`[EventBus] Error in listener for event ${event}:`, err);
      });
    }
  }
}
