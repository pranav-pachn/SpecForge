import { Queue, QueueOptions, DefaultJobOptions } from 'bullmq';
import Redis from 'ioredis';

// Centralized queue names
export const QueueNames = {
  EVENTS: 'specforge-events',
  EVENTS_DEAD_LETTER: 'specforge-events-dead',
  AI: 'specforge-ai',
  EMBEDDINGS: 'specforge-embeddings',
  INDEXING: 'specforge-indexing',
  AUTONOMOUS: 'specforge-autonomous',
  BENCHMARK: 'specforge-benchmark',
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
  private static available = false;
  private loggedUnavailable = false;

  private constructor() {}

  /** One attempt. A down Redis server must not keep reconnecting and flooding the terminal. */
  public static async probe(): Promise<boolean> {
    const url = process.env.REDIS_URL;
    if (!url) {
      QueueManager.available = false;
      return false;
    }

    const client = new Redis(url, {
      lazyConnect: true,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      family: 4,
      retryStrategy: () => null,
    });
    client.on('error', () => {});

    try {
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      QueueManager.available = pong === 'PONG';
    } catch {
      client.disconnect();
      QueueManager.available = false;
    }
    return QueueManager.available;
  }

  public isAvailable(): boolean {
    return QueueManager.available;
  }

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public getConnection(): Redis | null {
    if (!process.env.REDIS_URL || !QueueManager.available) return null;
    if (!this.connection) {
      this.connection = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        family: 4,
        connectTimeout: 2000,
        retryStrategy: (times) => (times > 2 ? null : times * 200),
      });
      this.connection.on('error', (err) => {
        if (this.loggedUnavailable) return;
        this.loggedUnavailable = true;
        console.warn(`[QueueManager] Redis unavailable (${err.message}). Background queues are paused.`);
      });
    }
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
