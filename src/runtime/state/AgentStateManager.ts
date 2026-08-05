import { db as prisma } from '@/platform/storage/db';
import { AgentExecutionStatus } from '@prisma/client';

export { AgentExecutionStatus as ExecutionStatus };

type ValidTransitions = {
  [key in AgentExecutionStatus]: AgentExecutionStatus[];
};

const TRANSITIONS: ValidTransitions = {
  [AgentExecutionStatus.PENDING]: [AgentExecutionStatus.RUNNING],
  [AgentExecutionStatus.RUNNING]: [
    AgentExecutionStatus.STREAMING,
    AgentExecutionStatus.PAUSED,
    AgentExecutionStatus.COMPLETED,
    AgentExecutionStatus.FAILED,
    AgentExecutionStatus.CANCELLED,
    AgentExecutionStatus.TIMEOUT
  ],
  [AgentExecutionStatus.STREAMING]: [
    AgentExecutionStatus.COMPLETED,
    AgentExecutionStatus.FAILED,
    AgentExecutionStatus.CANCELLED,
    AgentExecutionStatus.TIMEOUT
  ],
  [AgentExecutionStatus.PAUSED]: [AgentExecutionStatus.RUNNING, AgentExecutionStatus.CANCELLED],
  [AgentExecutionStatus.COMPLETED]: [],
  [AgentExecutionStatus.FAILED]: [AgentExecutionStatus.RUNNING], // Retry
  [AgentExecutionStatus.CANCELLED]: [],
  [AgentExecutionStatus.TIMEOUT]: [AgentExecutionStatus.RUNNING] // Retry
};

export class AgentStateManager {
  static async createExecution(workflowId: string, agentId: string): Promise<string> {
    const execution = await prisma.agentExecution.create({
      data: {
        workflowId,
        agentId,
        status: AgentExecutionStatus.PENDING
      }
    });
    return execution.id;
  }

  static async transition(
    executionId: string,
    newStatus: AgentExecutionStatus,
    payload?: { error?: string; durationMs?: number }
  ): Promise<void> {
    const execution = await prisma.agentExecution.findUnique({ where: { id: executionId } });
    if (!execution) throw new Error(`Execution ${executionId} not found`);

    const currentStatus = execution.status as AgentExecutionStatus;
    const allowed = TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Invalid state transition: ${currentStatus} -> ${newStatus}`);
    }

    const updateData: any = { status: newStatus };
    
    if (newStatus === AgentExecutionStatus.RUNNING && currentStatus !== AgentExecutionStatus.PAUSED) {
      updateData.startedAt = new Date();
      if (currentStatus === AgentExecutionStatus.FAILED || currentStatus === AgentExecutionStatus.TIMEOUT) {
        updateData.retries = execution.retries + 1;
      }
    } else if (
      newStatus === AgentExecutionStatus.COMPLETED ||
      newStatus === AgentExecutionStatus.FAILED ||
      newStatus === AgentExecutionStatus.CANCELLED ||
      newStatus === AgentExecutionStatus.TIMEOUT
    ) {
      updateData.completedAt = new Date();
      if (payload?.durationMs) updateData.durationMs = payload.durationMs;
      if (payload?.error) updateData.error = payload.error;
    }

    await prisma.agentExecution.update({
      where: { id: executionId },
      data: updateData
    });
  }
}
