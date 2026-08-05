import { DomainEvent } from './DomainEvent';
import { db } from '@/platform/storage/db';
import { DomainEventType } from './DomainEventType';

export interface ReplayOptions {
  fromSequence?: number;
  toSequence?: number;
}

export type EventStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER';

export class EventStore {
  async append(event: DomainEvent): Promise<void> {
    try {
      let sequence = event.sequence;
      
      // Auto-increment sequence per workflow if not provided
      if (event.workflowId && sequence === undefined) {
        const lastEvent = await db.storedEvent.findFirst({
          where: { workflowId: event.workflowId },
          orderBy: { sequence: 'desc' },
          select: { sequence: true }
        });
        sequence = lastEvent ? lastEvent.sequence + 1 : 1;
      } else if (sequence === undefined) {
        sequence = 0; // Fallback for system-level events without a workflow
      }

      const storedEvent = await db.storedEvent.create({
        data: {
          id: event.id,
          type: event.type,
          source: event.source,
          occurredAt: event.occurredAt,
          workflowId: event.workflowId,
          sequence: sequence,
          userId: event.userId,
          correlationId: event.correlationId,
          causationId: event.causationId,
          status: event.status || 'QUEUED', // Default to QUEUED for Phase 3
          payload: event.payload as any, // Prisma Json compatibility
        }
      });
      
      // Mutate the original event object so dispatchers have the sequence and status
      event.sequence = storedEvent.sequence;
      event.status = storedEvent.status;
      
      console.log(`[EventStore] Persisted ${event.type} (seq: ${sequence}) for workflow ${event.workflowId || 'none'}`);
    } catch (err) {
      console.error(`[EventStore] Failed to persist event ${event.type}`, err);
      throw err;
    }
  }

  async getEvent(id: string): Promise<DomainEvent | null> {
    const e = await db.storedEvent.findUnique({ where: { id } });
    if (!e) return null;
    
    return {
      id: e.id,
      type: e.type as DomainEventType,
      source: e.source,
      occurredAt: e.occurredAt,
      version: 1, // Fallback until db schema is updated
      workflowId: e.workflowId || undefined,
      sequence: e.sequence,
      userId: e.userId || undefined,
      correlationId: e.correlationId || undefined,
      causationId: e.causationId || undefined,
      status: e.status,
      payload: e.payload
    };
  }

  async updateStatus(id: string, status: EventStatus): Promise<void> {
    await db.storedEvent.update({
      where: { id },
      data: { status }
    });
  }

  async getEvents(workflowId?: string, options?: ReplayOptions): Promise<DomainEvent[]> {
    const whereClause: any = {};
    if (workflowId) {
      whereClause.workflowId = workflowId;
    }
    
    if (options?.fromSequence !== undefined || options?.toSequence !== undefined) {
      whereClause.sequence = {};
      if (options.fromSequence !== undefined) whereClause.sequence.gte = options.fromSequence;
      if (options.toSequence !== undefined) whereClause.sequence.lte = options.toSequence;
    }

    const storedEvents = await db.storedEvent.findMany({
      where: whereClause,
      orderBy: [
        { workflowId: 'asc' }, // In case multiple workflows
        { sequence: 'asc' },
        { occurredAt: 'asc' } // Fallback
      ]
    });

    return storedEvents.map(e => ({
      id: e.id,
      type: e.type as DomainEventType,
      source: e.source,
      occurredAt: e.occurredAt,
      version: 1, // Fallback until db schema is updated
      workflowId: e.workflowId || undefined,
      sequence: e.sequence,
      userId: e.userId || undefined,
      correlationId: e.correlationId || undefined,
      causationId: e.causationId || undefined,
      status: e.status,
      payload: e.payload
    }));
  }

  async replay(workflowId: string, options?: ReplayOptions): Promise<DomainEvent[]> {
    return this.getEvents(workflowId, options);
  }
}
