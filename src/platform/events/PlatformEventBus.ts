import { GraphNode, GraphEdge } from "@/intelligence/graph/NodeTypes";

export type PlatformEventType = 
  // Core AI Events
  | "NODE_CREATED" 
  | "NODE_UPDATED" 
  | "NODE_DELETED"
  | "EDGE_CREATED" 
  | "EDGE_REMOVED"
  | "WORKFLOW_COMPLETED"
  | "DRIFT_DETECTED"
  | "DRIFT_RESOLVED"
  // Enterprise Domain Events
  | "WORKFLOW_CREATED"
  | "SPEC_SUBMITTED"
  | "SPEC_APPROVED"
  | "SPEC_REJECTED"
  | "MEMORY_GENERATED"
  | "MEMORY_APPROVED"
  | "MEMORY_REJECTED"
  | "REVIEW_REQUESTED"
  | "REVIEW_COMPLETED"
  | "VALIDATION_COMPLETED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_STEP_COMPLETED"
  | "APPROVAL_COMPLETED"
  | "APPROVAL_REJECTED"
  | "APPROVAL_CANCELLED"
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "POLICY_CREATED";

export interface PlatformEventPayload {
  // Common
  timestamp: Date;
  metadata?: Record<string, any>;
  
  // Core Intelligence
  workflowId?: string;
  node?: GraphNode;
  edge?: GraphEdge;

  // Enterprise Governance
  eventId: string;
  correlationId: string;
  causationId?: string;
  orgId?: string;
  userId?: string;
  entityType: string;
  entityId?: string;
}

type EventListener = (payload: PlatformEventPayload) => Promise<void> | void;

/**
 * Unified Event-Driven Backbone for SpecForge Platform.
 * Merges IntelligenceEventBus and EnterpriseEventBus into one.
 */
export class PlatformEventBus {
  private static listeners: Record<string, EventListener[]> = {};

  static subscribe(event: PlatformEventType, listener: EventListener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  static async emit(
    event: PlatformEventType,
    payload: Omit<PlatformEventPayload, "eventId" | "correlationId"> & { eventId?: string; correlationId?: string; }
  ) {
    const fullPayload: PlatformEventPayload = {
      ...payload,
      eventId: payload.eventId || crypto.randomUUID(),
      correlationId: payload.correlationId || crypto.randomUUID()
    };

    const eventListeners = this.listeners[event] || [];
    
    // Non-blocking fire-and-forget for listeners
    for (const listener of eventListeners) {
      Promise.resolve(listener(fullPayload)).catch(err => {
        console.error(`[PlatformEventBus] Error in listener for event ${event}:`, err);
      });
    }
  }
}
