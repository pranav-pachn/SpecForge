import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class LoggingSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["*"];
  priority: number = 0; // Runs first

  async handle(event: DomainEvent): Promise<void> {
    console.log(`[Event: ${event.type}]`, {
      id: event.id,
      workflowId: event.workflowId,
      timestamp: event.occurredAt.toISOString(),
      payload: event.payload
    });
  }
}
