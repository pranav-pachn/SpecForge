import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';

export interface EventSubscriber<T extends DomainEvent = DomainEvent> {
  eventTypes: DomainEventType[];
  priority: number;
  handle(event: T): Promise<void>;
}
