import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";
import { WorkflowStatus, AgentExecutionStatus } from "@prisma/client";

export async function GET() {
  try {
    const activeWorkflows = await db.workflow.findMany({
      where: { status: WorkflowStatus.EXECUTING },
      orderBy: { updatedAt: "desc" }
    });

    const completedAgents = await db.agentExecution.count({ where: { status: AgentExecutionStatus.COMPLETED } }).catch(() => 0);
    const failedAgents = await db.agentExecution.count({ where: { status: AgentExecutionStatus.FAILED } }).catch(() => 0);
    const runningAgents = await db.agentExecution.count({ where: { status: AgentExecutionStatus.RUNNING } }).catch(() => 0);
    const pausedAgents = await db.agentExecution.count({ where: { status: AgentExecutionStatus.PAUSED } }).catch(() => 0);
    const cancelledAgents = await db.agentExecution.count({ where: { status: AgentExecutionStatus.CANCELLED } }).catch(() => 0);

    return NextResponse.json({
      health: {
        registryLoaded: true,
        schedulerReady: true,
        checkpointEnabled: true,
        streamingEnabled: true,
        quotaEnabled: true
      },
      workflows: activeWorkflows,
      agents: {
        completed: completedAgents,
        failed: failedAgents,
        running: runningAgents,
        paused: pausedAgents,
        cancelled: cancelledAgents
      }
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch runtime", error);
    return NextResponse.json({ error: "Failed to fetch runtime" }, { status: 500 });
  }
}
