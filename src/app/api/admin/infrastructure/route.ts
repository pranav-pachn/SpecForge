import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/platform/storage/db";
import { QueueManager, QueueNames } from "@/platform/queue/QueueManager";

export async function GET() {
  try {
    const startPostgres = Date.now();
    let postgresStatus = "Disconnected";
    let postgresLatency = 0;
    try {
      await db.$queryRaw`SELECT 1`;
      postgresLatency = Date.now() - startPostgres;
      postgresStatus = "Connected";
    } catch (e) {
      postgresStatus = "Error";
    }

    const startRedis = Date.now();
    let redisStatus = "Disconnected";
    let redisLatency = 0;
    let bullmqWorkers = 0;
    let bullmqQueueLength = 0;
    let bullmqDeadLetter = 0;
    
    try {
      const redis = QueueManager.getInstance().getConnection();
      if (redis) {
        await redis.ping();
        redisLatency = Date.now() - startRedis;
        redisStatus = "Connected";

        // Query BullMQ stats
        const queueManager = QueueManager.getInstance();
        const eventsQueue = queueManager.getQueue(QueueNames.EVENTS);
        
        bullmqWorkers = await eventsQueue.getWorkers().then(w => w.length).catch(() => 0);
        bullmqQueueLength = await eventsQueue.getWaitingCount();
        bullmqDeadLetter = await eventsQueue.getFailedCount();
      } else {
        redisStatus = "Disabled (Sync Fallback)";
      }
    } catch (e) {
      redisStatus = "Error";
    }

    let pgvectorStatus = "Inactive";
    try {
      const res: any = await db.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
      if (res && res.length > 0) {
        pgvectorStatus = "Active";
      }
    } catch (e) {
      // Ignored
    }

    return NextResponse.json({
      postgres: {
        status: postgresStatus,
        latencyMs: postgresLatency
      },
      redis: {
        status: redisStatus,
        latencyMs: redisLatency
      },
      bullmq: {
        activeWorkers: bullmqWorkers,
        queueLength: bullmqQueueLength,
        deadLetterQueue: bullmqDeadLetter
      },
      pgvector: {
        status: pgvectorStatus
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || "unknown",
        REDIS_URL: process.env.REDIS_URL ? "Set" : "Not Set",
        DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not Set",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Set" : "Not Set"
      }
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch infrastructure", error);
    return NextResponse.json({ error: "Failed to fetch infrastructure" }, { status: 500 });
  }
}
