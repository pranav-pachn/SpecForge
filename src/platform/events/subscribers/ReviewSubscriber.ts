import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class ReviewSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["SpecificationCreated"];
  priority: number = 200;

  async handle(event: DomainEvent): Promise<void> {
    // Phase 2A placeholder: In the future, this triggers the Review Engine asynchronously
    console.log(`[ReviewSubscriber] Notified for ${event.type}`);
  }
}
