import { EventBus } from '@/workflow/engine/EventBus';
import { PlatformEventBus } from '../PlatformEventBus';
import { RuntimeToDomainMapper } from './RuntimeToDomainMapper';

export class RuntimeEventBridge {
  private unsubscribers: (() => void)[] = [];

  constructor(private runtimeEventBus: EventBus) {}

  /**
   * Subscribes to the runtime internal EventBus and publishes mapped 
   * business-significant events to the PlatformEventBus.
   */
  start() {
    // We subscribe to all events manually or by patching the bus to intercept all.
    // Since EventBus currently uses specific types, we can just hook into the ones we care about,
    // or hook a wildcard if the EventBus supports it.
    // The current EventBus doesn't have a wildcard listener, so we'll explicitly listen to the ones we map.
    const bridgeableEvents = [
      'PipelineStarted',
      'PipelineCompleted',
      'PipelineFailed',
      'ApprovalRequested',
      'AgentCompleted'
    ] as const;

    bridgeableEvents.forEach(eventType => {
      const unsub = this.runtimeEventBus.on(eventType, async (event) => {
        const domainEvent = RuntimeToDomainMapper.map(event);
        if (domainEvent) {
          try {
            await PlatformEventBus.publish(domainEvent);
          } catch (err) {
            console.error(`[RuntimeEventBridge] Failed to publish domain event ${domainEvent.type}`, err);
          }
        }
      });
      this.unsubscribers.push(unsub);
    });
  }

  stop() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
