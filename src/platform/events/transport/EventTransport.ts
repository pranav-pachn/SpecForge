import { DomainEvent } from '../DomainEvent';

export interface EventTransport {
  send(event: DomainEvent): Promise<void>;
}
