import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";
import { QueueManager } from "@/platform/queue/QueueManager";
import { WorkflowStatus } from "@prisma/client";

export async function GET() {
  try {
    // 1. Workflows
    const workflows = await db.workflow.groupBy({
      by: ["status"],
      _count: true
    });
    const runningWorkflows = workflows.find(w => w.status === WorkflowStatus.EXECUTING)?._count || 0;
    const completedWorkflows = workflows.find(w => w.status === WorkflowStatus.COMPLETED)?._count || 0;

    // 2. Events
    const totalEvents = await db.storedEvent.count();

    // 3. Decisions
    const totalDecisions = await db.learningDecision.count();

    // 4. Vectors (Count from KnowledgeNode)
    let totalVectors = 0;
    try {
      totalVectors = await db.knowledgeNode.count();
    } catch (e) {
      // Ignored if pgvector not fully set up
    }

    // 5. Providers (Active ones)
    // Here we can count registered providers from CapabilityMap, or just mock for now
    const activeProviders = 3; 

    // 6. DB Health
    let dbHealthy = false;
    try {
      await db.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch (e) {
      console.error("DB Health Check Failed", e);
    }

    // 7. Redis Health
    let redisHealthy = false;
    try {
      const redis = QueueManager.getInstance().getConnection();
      if (redis) {
        await redis.ping();
        redisHealthy = true;
      }
    } catch (e) {
      console.error("Redis Health Check Failed", e);
    }

    return NextResponse.json({
      workflows: {
        running: runningWorkflows,
        completed: completedWorkflows
      },
      metrics: {
        events: totalEvents,
        decisions: totalDecisions,
        vectors: totalVectors,
        providers: activeProviders
      },
      health: {
        postgres: dbHealthy,
        redis: redisHealthy
      }
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch overview", error);
    return NextResponse.json({ error: "Failed to fetch overview" }, { status: 500 });
  }
}
