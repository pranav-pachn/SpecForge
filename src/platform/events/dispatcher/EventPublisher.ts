import { DomainEvent } from '../DomainEvent';

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
