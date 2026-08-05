import { DomainEvent } from '../DomainEvent';
import { EventPublisher } from './EventPublisher';
import { SubscriberRegistry } from './SubscriberRegistry';
import { EventStore } from '../EventStore';
import { EventTransport } from '../transport/EventTransport';
import { SyncTransport } from '../transport/SyncTransport';

export class EventDispatcher implements EventPublisher {
  private transport: EventTransport;

  constructor(
    private registry: SubscriberRegistry,
    private store: EventStore
  ) {
    // Default to synchronous transport initially.
    // PlatformEventBus or DI container will override this if Redis is enabled.
    this.transport = new SyncTransport(this);
  }

  public setTransport(transport: EventTransport): void {
    this.transport = transport;
  }

  async publish(event: DomainEvent): Promise<void> {
    // 1. Store event first
    try {
      await this.store.append(event);
    } catch (err) {
      console.error(`[EventDispatcher] Failed to store event ${event.type}`, err);
      throw err;
    }

    // 2. Delegate to transport (which may be sync or BullMQ)
    try {
      await this.transport.send(event);
    } catch (err) {
      console.error(`[EventDispatcher] Failed to send event to transport ${event.type}`, err);
      throw err;
    }
  }

  // Called by the Worker (or SyncTransport) to actually execute subscribers
  async dispatch(event: DomainEvent): Promise<void> {
    const subscribers = this.registry.getSubscribers(event.type);
    
    const promises = subscribers.map(async sub => {
      const start = Date.now();
      try {
        await sub.handle(event);
        console.log(`[EventDispatcher] Subscriber ${sub.constructor.name} completed in ${Date.now() - start}ms`);
      } catch (err) {
        console.error(`[EventDispatcher] Subscriber ${sub.constructor.name} failed after ${Date.now() - start}ms:`, err);
        throw err;
      }
    });
    
    // Use allSettled so one failing subscriber doesn't kill others
    const results = await Promise.allSettled(promises);
    
    // Throw an error if any subscriber failed, so the BullMQ job fails and gets retried.
    // If you prefer partial success, you might need a more complex retry strategy per subscriber.
    // For now, we will throw if ANY failed to leverage BullMQ retries for the whole event.
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`[EventDispatcher] ${failures.length} subscribers failed to process event ${event.type}`);
    }
  }
}
