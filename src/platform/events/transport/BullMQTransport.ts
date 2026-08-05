import { DomainEvent } from '../DomainEvent';
import { EventTransport } from './EventTransport';
import { QueueManager, QueueNames, EventJob } from '../../queue/QueueManager';

export class BullMQTransport implements EventTransport {
  async send(event: DomainEvent): Promise<void> {
    const queueManager = QueueManager.getInstance();
    const queue = queueManager.getQueue(QueueNames.EVENTS);

    const jobPayload: EventJob = {
      eventId: event.id,
      eventType: event.type,
      correlationId: event.correlationId,
    };

    // The name of the job can be the event type for easier debugging in BullMQ dashboards
    await queue.add(event.type, jobPayload, {
      jobId: event.id, // Ensure idempotency: same event ID = same job
    });
  }
}
