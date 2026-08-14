import { QueueManager, QueueNames } from './QueueManager';
import { RuntimeJob, JobType } from './interfaces/RuntimeJob';
import { PlatformEventBus } from '../events/PlatformEventBus';
import { db } from '../storage/db';

export class JobDispatcher {
  
  /**
   * Dispatches a job to the appropriate BullMQ queue based on its type.
   */
  public async dispatch(job: RuntimeJob): Promise<void> {
    
    // 1. Determine Queue Name based on Job Type
    let queueName: string;
    switch (job.type) {
      case JobType.AGENT: queueName = QueueNames.AI; break;
      case JobType.EVALUATION: queueName = (QueueNames as any).EVALUATION || 'specforge-evaluation'; break;
      case JobType.INDEXING: queueName = QueueNames.INDEXING; break;
      case JobType.MEMORY: queueName = (QueueNames as any).MEMORY || 'specforge-memory'; break;
      case JobType.MCP: queueName = (QueueNames as any).MCP || 'specforge-mcp'; break;
      case JobType.GRAPH: queueName = (QueueNames as any).GRAPH || 'specforge-graph'; break;
      case JobType.AUTONOMOUS_EXECUTION: queueName = QueueNames.AUTONOMOUS; break;
      case JobType.BENCHMARK: queueName = QueueNames.BENCHMARK; break;
      default:
        throw new Error(`[JobDispatcher] Unknown JobType: ${job.type}`);
    }

    const queue = QueueManager.getInstance().getQueue(queueName);
    
    // Persistence of RuntimeJob has been replaced by pure EventBus and BullMQ state

    await PlatformEventBus.publish({
      id: crypto.randomUUID(),
      type: "JobScheduled" as any,
      occurredAt: new Date(),
      version: 1,
      source: "JobDispatcher",
      workflowId: job.workflowId,
      correlationId: job.executionId,
      payload: { jobId: job.id, type: job.type }
    });

    // 3. Add to BullMQ
    // Since RuntimeJob persistence was removed, we pass the full job into BullMQ payload.
    const bullJob = await queue.add(
      job.type, 
      job, 
      { 
        jobId: job.id,
        priority: job.priority,
        attempts: job.retryPolicy?.maxAttempts || 3,
        backoff: {
          type: 'exponential',
          delay: job.retryPolicy?.backoffMs || 1000
        }
      }
    );

    // Emit Dispatched Event
    await PlatformEventBus.publish({
      id: crypto.randomUUID(),
      type: "JobDispatched" as any,
      occurredAt: new Date(),
      version: 1,
      source: "JobDispatcher",
      workflowId: job.workflowId,
      correlationId: job.executionId,
      payload: { jobId: job.id, type: job.type, queueName }
    });
    
    console.log(`[JobDispatcher] Dispatched Job ${job.id} (${job.type}) to ${queueName}`);
  }
}

export const jobDispatcher = new JobDispatcher();
