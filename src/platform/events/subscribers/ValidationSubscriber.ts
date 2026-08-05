import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class ValidationSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["ReviewCompleted"];
  priority: number = 300;

  async handle(event: DomainEvent): Promise<void> {
    // Phase 2A placeholder: In the future, this triggers the Validation Engine asynchronously
    console.log(`[ValidationSubscriber] Notified for ${event.type}`);
  }
}
