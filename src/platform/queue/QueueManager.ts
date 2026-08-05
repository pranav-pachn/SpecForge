import { Queue, QueueOptions, DefaultJobOptions } from 'bullmq';
import Redis from 'ioredis';

// Centralized queue names
export const QueueNames = {
  EVENTS: 'specforge-events',
  EVENTS_DEAD_LETTER: 'specforge-events-dead',
  AI: 'specforge-ai',
  EMBEDDINGS: 'specforge-embeddings',
  INDEXING: 'specforge-indexing',
} as const;

export interface EventJob {
  eventId: string;
  eventType: string;
  correlationId?: string;
}

export class QueueManager {
  private static instance: QueueManager;
  private connection: Redis | null = null;
  private queues: Map<string, Queue> = new Map();

  private constructor() {
    if (process.env.REDIS_URL) {
      this.connection = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by bullmq
      });
      
      this.connection.on('error', (err) => {
        console.error('[QueueManager] Redis connection error:', err);
      });
    }
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public getConnection(): Redis | null {
    return this.connection;
  }

  public getQueue(name: string): Queue {
    if (!this.connection) {
      throw new Error("Redis connection not initialized. Check REDIS_URL.");
    }

    if (!this.queues.has(name)) {
      const defaultJobOptions: DefaultJobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000 // 1s, 2s, 4s
        },
        removeOnComplete: 100, // keep last 100 jobs
        removeOnFail: 1000,
      };

      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions
      });

      this.queues.set(name, queue);
    }

    return this.queues.get(name)!;
  }
}
