import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';

export class NotificationSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["WorkflowCompleted"];
  priority: number = 900;

  async handle(event: DomainEvent): Promise<void> {
    // Phase 2A placeholder: Would send Email/Slack/In-App notification
    console.log(`[NotificationSubscriber] Notification sent for ${event.type}`);
  }
}
