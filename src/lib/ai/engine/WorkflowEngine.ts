import { EventBus } from './EventBus';
import { PipelineDefinition } from './Pipeline';
import { WorkflowContext, StageRecord } from './WorkflowContext';

export class WorkflowEngine {
  constructor(private eventBus: EventBus) {}

  async execute(pipeline: PipelineDefinition, ctx: WorkflowContext): Promise<WorkflowContext> {
    this.eventBus.emit({ 
      type: 'PipelineStarted', 
      workflowId: ctx.input.workflowId, 
      timestamp: new Date() 
    });
    
    for (const agent of pipeline.steps) {
      this.eventBus.emit({ 
        type: 'AgentStarted', 
        workflowId: ctx.input.workflowId, 
        agent: agent.name, 
        timestamp: new Date() 
      });
      
      const stageRecord: StageRecord = {
        agent: agent.name,
        status: 'running',
        startedAt: new Date()
      };
      ctx.execution.stages.push(stageRecord);

      try {
        const output = await agent.execute(ctx);
        // Safely write to artifacts
        (ctx.artifacts as any)[agent.capability] = output;
        
        stageRecord.status = 'done';
        stageRecord.completedAt = new Date();
        stageRecord.latencyMs = stageRecord.completedAt.getTime() - stageRecord.startedAt!.getTime();
        
        this.eventBus.emit({ 
          type: 'AgentCompleted', 
          workflowId: ctx.input.workflowId, 
          agent: agent.name, 
          timestamp: new Date() 
        });
      } catch (err: any) {
        stageRecord.status = 'failed';
        stageRecord.error = err.message || 'Unknown error';
        stageRecord.completedAt = new Date();
        stageRecord.latencyMs = stageRecord.completedAt.getTime() - stageRecord.startedAt!.getTime();
        
        this.eventBus.emit({ 
          type: 'AgentFailed', 
          workflowId: ctx.input.workflowId, 
          agent: agent.name, 
          payload: err, 
          timestamp: new Date() 
        });
        
        this.eventBus.emit({ 
          type: 'PipelineFailed', 
          workflowId: ctx.input.workflowId, 
          payload: err, 
          timestamp: new Date() 
        });
        throw err;
      }
    }
    
    this.eventBus.emit({ 
      type: 'PipelineCompleted', 
      workflowId: ctx.input.workflowId, 
      timestamp: new Date() 
    });
    return ctx;
  }
}
