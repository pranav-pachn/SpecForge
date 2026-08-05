import { Worker, Job } from 'bullmq';
import { QueueManager, QueueNames, EventJob } from './QueueManager';
import { PlatformEventBus } from '../events/PlatformEventBus';

export class EventWorker {
  private worker: Worker | null = null;

  constructor() {
    const queueManager = QueueManager.getInstance();
    const connection = queueManager.getConnection();

    if (!connection) {
      console.log('[EventWorker] Redis connection not available. Worker will not start.');
      return;
    }

    this.worker = new Worker(QueueNames.EVENTS, async (job: Job<EventJob>) => {
      const { eventId, eventType } = job.data;
      
      const store = PlatformEventBus.getStore();
      
      console.log(`[EventWorker] Processing job ${job.id} for event ${eventType} (${eventId})`);
      
      // Update status to PROCESSING
      await store.updateStatus(eventId, 'PROCESSING');
      
      try {
        // Load full event payload
        const event = await store.getEvent(eventId);
        if (!event) {
          throw new Error(`Event not found in store: ${eventId}`);
        }
        
        // Dispatch to subscribers
        const dispatcher = PlatformEventBus.getDispatcher();
        await dispatcher.dispatch(event);
        
        // Update status to COMPLETED
        await store.updateStatus(eventId, 'COMPLETED');
        console.log(`[EventWorker] Successfully processed event ${eventId}`);
      } catch (err) {
        console.error(`[EventWorker] Failed to process event ${eventId}`, err);
        // BullMQ will auto-retry based on the defaultJobOptions configured in QueueManager
        await store.updateStatus(eventId, 'FAILED'); // Will be updated to RETRYING by BullMQ event listeners later if needed
        throw err;
      }
    }, { connection });

    this.worker.on('failed', (job, err) => {
      console.error(`[EventWorker] Job ${job?.id} failed:`, err);
    });
  }
}
