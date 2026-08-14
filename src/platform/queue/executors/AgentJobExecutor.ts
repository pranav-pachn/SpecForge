import { JobExecutor } from './ExecutorRegistry';
import { RuntimeJob } from '../interfaces/RuntimeJob';
import { EventBus } from '../../../workflow/engine/EventBus';

export class AgentJobExecutor implements JobExecutor {
  async execute(job: RuntimeJob): Promise<any> {
    if (!job.nodeId) {
      throw new Error(`[AgentJobExecutor] Job ${job.id} has no nodeId (agentId) specified`);
    }

    // Lazy load the runtime to avoid circular dependencies
    const { AgentRuntime } = await import('../../../runtime/AgentRuntime');
    const runtime = new AgentRuntime(new EventBus());
    
    // We would also need to load the real ExecutionContext from the DB
    // For demonstration, we construct an empty one
    const context: any = { workflowId: job.workflowId };

    const traceOptions = {
      traceId: job.payload?.traceId as string,
      parentSpanId: job.payload?.parentSpanId as string | undefined
    };

    const result = await (runtime as any).executeNode(job.nodeId, job.payload.request as any, context, traceOptions);
    return result;
  }
}
