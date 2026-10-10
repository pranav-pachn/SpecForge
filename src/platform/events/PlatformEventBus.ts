import { GraphNode, GraphEdge } from "@/intelligence/graph/NodeTypes";
import { EventDispatcher } from "./dispatcher/EventDispatcher";
import { SubscriberRegistry } from "./dispatcher/SubscriberRegistry";
import { EventStore } from "./EventStore";
import { DomainEvent } from "./DomainEvent";
import { EventSubscriber } from "./dispatcher/EventSubscriber";
import { EventPublisher } from "./dispatcher/EventPublisher";
import { BullMQTransport } from "./transport/BullMQTransport";

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
  | "DECISION_CREATED"
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
 * Supports both legacy emit/subscribe and new DomainEvent typed dispatch.
 */
export class PlatformEventBus {
  // Legacy
  private static legacyListeners: Record<string, EventListener[]> = {};

  // Phase 2A Core Event Infrastructure
  private static registry = new SubscriberRegistry();
  private static store = new EventStore();
  private static dispatcher = new EventDispatcher(PlatformEventBus.registry, PlatformEventBus.store);

  // --- NEW API (Domain Events) ---
  
  static register(subscriber: EventSubscriber): void {
    this.registry.register(subscriber);
  }

  static async publish(event: DomainEvent): Promise<void> {
    await this.dispatcher.publish(event);
  }

  static getPublisher(): EventPublisher {
    return this.dispatcher;
  }

  static getDispatcher(): EventDispatcher {
    return this.dispatcher;
  }

  static initializeTransport(): void {
    console.log('[PlatformEventBus] Initializing BullMQ transport.');
    this.dispatcher.setTransport(new BullMQTransport());
  }

  static getStore(): EventStore {
    return this.store;
  }

  // --- LEGACY API (Will be phased out in Phase B) ---

  /**
   * @deprecated Use EventSubscriber implementations and register() instead.
   */
  static subscribe(event: PlatformEventType, listener: EventListener) {
    if (!this.legacyListeners[event]) {
      this.legacyListeners[event] = [];
    }
    this.legacyListeners[event].push(listener);
  }

  /**
   * @deprecated Use PlatformEventBus.publish() with a DomainEvent from EventFactory instead.
   */
  static async emit(
    event: PlatformEventType,
    payload: Omit<PlatformEventPayload, "eventId" | "correlationId"> & { eventId?: string; correlationId?: string; }
  ) {
    const fullPayload: PlatformEventPayload = {
      ...payload,
      eventId: payload.eventId || crypto.randomUUID(),
      correlationId: payload.correlationId || crypto.randomUUID()
    };

    // 1. Fire legacy listeners for backward compatibility during Phase A
    const eventListeners = this.legacyListeners[event] || [];
    for (const listener of eventListeners) {
      Promise.resolve(listener(fullPayload)).catch(err => {
        console.error(`[PlatformEventBus] Error in legacy listener for event ${event}:`, err);
      });
    }

    // 2. Map known legacy string events to true DomainEvents to propagate through Phase 1 architecture
    // We do a basic mapping by changing uppercase SNAKE_CASE to PascalCase (e.g., WORKFLOW_CREATED -> WorkflowCreated)
    // For a strict mapping, we could use EventFactory, but dynamically publishing a generic DomainEvent works for the bridge.
    const domainEventType = event.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('') as any;
    
    try {
      await this.publish({
        id: fullPayload.eventId,
        type: domainEventType,
        occurredAt: fullPayload.timestamp,
        version: 1,
        correlationId: fullPayload.correlationId,
        causationId: fullPayload.causationId,
        workflowId: fullPayload.workflowId,
        userId: fullPayload.userId,
        source: "LegacyEmitBridge",
        payload: fullPayload
      });
    } catch (err) {
      console.error(`[PlatformEventBus] Failed to bridge legacy event ${event} to DomainEvent:`, err);
    }
  }
}
