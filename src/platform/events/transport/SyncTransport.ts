import { DomainEvent } from '../DomainEvent';
import { EventTransport } from './EventTransport';
import { EventDispatcher } from '../dispatcher/EventDispatcher';

export class SyncTransport implements EventTransport {
  constructor(private dispatcher: EventDispatcher) {}

  async send(event: DomainEvent): Promise<void> {
    // In synchronous mode, we immediately dispatch the event
    await this.dispatcher.dispatch(event);
  }
}
