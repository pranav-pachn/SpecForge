import { EventBus } from './EventBus';
import { PipelineDefinition } from './Pipeline';
import { WorkflowContext } from './WorkflowContext';
import { AgentRuntime } from '../../runtime/AgentRuntime';
import { Scheduler } from '../../runtime/scheduler/Scheduler';
import { AgentRequest } from '../../runtime/interfaces/AgentRequest';
import { ExecutionContext } from '../../runtime/context/ExecutionContext';
import { CancellationRegistry } from '../../runtime/cancellation/CancellationRegistry';
import { RuntimeEventBridge } from '../../platform/events/bridge/RuntimeEventBridge';

export class WorkflowEngine {
  private runtime: AgentRuntime;
  private scheduler: Scheduler;
  private bridge: RuntimeEventBridge;

  constructor(private eventBus: EventBus) {
    this.runtime = new AgentRuntime(this.eventBus);
    this.scheduler = new Scheduler();
    this.bridge = new RuntimeEventBridge(this.eventBus);
    this.bridge.start();
  }

  async execute(pipeline: PipelineDefinition, ctx: WorkflowContext): Promise<WorkflowContext> {
    this.eventBus.emit({ 
      type: 'PipelineStarted', 
      workflowId: ctx.input.workflowId, 
      timestamp: new Date() 
    });
    
    // We register the root cancellation token in the registry so the API can reach it
    const cancellationToken = CancellationRegistry.getInstance().register(ctx.input.workflowId);
    
    const executionContext: ExecutionContext = {
      workflowId: ctx.input.workflowId,
      projectId: ctx.input.projectId || '',
      userId: ctx.input.userId,
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      artifacts: ctx.artifacts,
      cancellationToken
    };

    const request: AgentRequest = {
      workflowId: ctx.input.workflowId,
      userId: ctx.input.userId,
      payload: ctx.input // We pass the raw workflow input as the payload
    };

    // Use scheduler to get an execution graph (DAG)
    const graph = this.scheduler.schedule(request, pipeline.steps);

    try {
      const state = await this.runtime.runGraph(graph, request, executionContext);
      
      if (state.status === 'FAILED' || state.status === 'TIMEOUT') {
        throw new Error(`Pipeline execution ${state.status.toLowerCase()}`);
      }
      
      ctx.artifacts = executionContext.artifacts;
      
      this.eventBus.emit({ 
        type: 'PipelineCompleted', 
        workflowId: ctx.input.workflowId, 
        timestamp: new Date() 
      });
      
    } catch (err: any) {
      this.eventBus.emit({ 
        type: 'PipelineFailed', 
        workflowId: ctx.input.workflowId, 
        payload: err, 
        timestamp: new Date() 
      });
      throw err;
    } finally {
      CancellationRegistry.getInstance().unregister(ctx.input.workflowId);
    }
    
    return ctx;
  }
}
