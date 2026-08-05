import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class ExecutionPackSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["TasksGenerated"];
  priority: number = 200;

  async handle(event: DomainEvent): Promise<void> {
    // Phase 2A placeholder: In the future, this triggers Execution Pack generation
    console.log(`[ExecutionPackSubscriber] Notified for ${event.type}`);
  }
}
