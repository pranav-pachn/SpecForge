import { DomainEvent } from "@/platform/events/DomainEvent";
import { DomainEventType } from "@/platform/events/DomainEventType";
import { EventSubscriber } from "@/platform/events/dispatcher/EventSubscriber";

export class EvolutionSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["ReviewCompleted", "ValidationCompleted"];
  priority: number = 90;

  async handle(event: DomainEvent): Promise<void> {
    console.log(`[EvolutionSubscriber] Decision models removed. Skipping evidence attachment.`);
  }
}
