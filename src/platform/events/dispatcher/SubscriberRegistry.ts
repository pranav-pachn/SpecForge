import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from './EventSubscriber';

export class SubscriberRegistry {
  private subscribers = new Map<DomainEventType, EventSubscriber[]>();

  register(subscriber: EventSubscriber): void {
    const types = subscriber.eventTypes;
    for (const type of types) {
      const list = this.subscribers.get(type) || [];
      list.push(subscriber);
      
      // Keep sorted by priority (lowest number = highest priority)
      list.sort((a, b) => a.priority - b.priority);
      
      this.subscribers.set(type, list);
    }
  }

  getSubscribers(eventType: DomainEventType): EventSubscriber[] {
    const specific = this.subscribers.get(eventType) || [];
    const wildcard = this.subscribers.get("*") || [];
    
    // Deduplicate in case a subscriber registered for both * and specific
    const combined = Array.from(new Set([...specific, ...wildcard]));
    combined.sort((a, b) => a.priority - b.priority);
    
    return combined;
  }
}
