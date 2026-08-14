import { Worker, Job } from 'bullmq';
import { QueueManager } from '../../platform/queue/QueueManager';
import { RuntimeJob } from '../../platform/queue/interfaces/RuntimeJob';
import { db } from '../../platform/storage/db';
import { PlatformEventBus } from '../../platform/events/PlatformEventBus';
import { runtimeJobExecutor } from '../../platform/queue/executors/RuntimeJobExecutor';
import { WorkerRegistry } from '../../platform/queue/WorkerRegistry';

export abstract class BaseWorker {
  protected worker: Worker | null = null;

  constructor(
    protected queueName: string,
    protected workerId: string
  ) {
    const queueManager = QueueManager.getInstance();
    const connection = queueManager.getConnection();

    if (!connection) {
      console.warn(`[BaseWorker] Redis not available. Worker ${workerId} will not start.`);
      return;
    }

    this.worker = new Worker(queueName, async (bullJob: Job) => {
      const { jobId } = bullJob.data;

      // 1. Load job from immutable table
      const job = await (db as any).runtimeJob.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new Error(`Job not found: ${jobId}`);
      }

      // 2. Create Execution record
      const execution = await (db as any).jobExecution.create({
        data: {
          jobId: job.id,
          workerId: this.workerId,
          attempt: bullJob.attemptsMade + 1,
          status: 'RUNNING'
        }
      });

      try {
        await PlatformEventBus.publish({
          id: crypto.randomUUID(),
          type: "JobStarted" as any,
          occurredAt: new Date(),
          version: 1,
          source: this.workerId,
          workflowId: job.workflowId,
          correlationId: job.executionId || undefined,
          payload: { jobId: job.id, executionId: execution.id }
        });

        // 3. Execute via RuntimeJobExecutor
        const result = await runtimeJobExecutor.execute({
          id: job.id,
          workflowId: job.workflowId,
          executionId: job.executionId || undefined,
          graphId: job.graphId || undefined,
          nodeId: job.nodeId || undefined,
          type: job.type,
          priority: job.priority,
          payload: job.payload as Record<string, unknown>,
          retryPolicy: job.retryPolicy as any,
          metadata: job.metadata as any
        });

        // 4. Record Success
        await (db as any).jobExecution.update({
          where: { id: execution.id },
          data: { status: 'COMPLETED', result: result || {}, completedAt: new Date() }
        });

        await PlatformEventBus.publish({
          id: crypto.randomUUID(),
          type: "JobCompleted" as any,
          occurredAt: new Date(),
          version: 1,
          source: this.workerId,
          workflowId: job.workflowId,
          correlationId: job.executionId || undefined,
          payload: { jobId: job.id, executionId: execution.id, result }
        });

      } catch (err: any) {
        // Record Failure
        const isRetrying = bullJob.attemptsMade + 1 < (job.retryPolicy as any)?.maxAttempts;
        
        await (db as any).jobExecution.update({
          where: { id: execution.id },
          data: { 
            status: isRetrying ? 'RETRYING' : 'FAILED', 
            error: err.message, 
            completedAt: new Date() 
          }
        });

        await PlatformEventBus.publish({
          id: crypto.randomUUID(),
          type: (isRetrying ? "JobRetrying" : "JobFailed") as any,
          occurredAt: new Date(),
          version: 1,
          source: this.workerId,
          workflowId: job.workflowId,
          correlationId: job.executionId || undefined,
          payload: { jobId: job.id, executionId: execution.id, error: err.message }
        });

        throw err; // Let BullMQ handle retry queueing
      }
    }, { connection });
    
    // Heartbeat reporting for Registry
    setInterval(() => {
      WorkerRegistry.getInstance().heartbeat(this.workerId, {
        activeJobs: this.worker?.isRunning() ? 1 : 0, // Simplified metric
        avgDuration: 0 // Would be aggregated properly in a real app
      });
    }, 15000);
  }
}
