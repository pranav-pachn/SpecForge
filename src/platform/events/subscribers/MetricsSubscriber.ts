import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class MetricsSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["WorkflowCompleted", "ValidationCompleted"];
  priority: number = 1000; // Run late

  async handle(event: DomainEvent): Promise<void> {
    // Phase 2A placeholder: Would dispatch to Analytics/Telemetry
    console.log(`[MetricsSubscriber] Metric tracked for ${event.type}`);
  }
}
