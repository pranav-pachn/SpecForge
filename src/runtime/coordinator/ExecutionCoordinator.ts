import { ExecutionGraph, ExecutionGroup } from '../engine/ExecutionGraph';
import { AgentRequest } from '../interfaces/AgentRequest';
import { ExecutionContext } from '../context/ExecutionContext';
import { jobDispatcher } from '../../platform/queue/JobDispatcher';
import { JobType, JobPriority, RuntimeJob } from '../../platform/queue/interfaces/RuntimeJob';
import { db } from '../../platform/storage/db';

import { Tracer, SpanKind, SpanStatus } from '../../platform/telemetry/Tracer';

export class ExecutionCoordinator {
  /**
   * Traverses an ExecutionGraph and queues nodes (agents) that are ready to run.
   */
  public async coordinate(
    graph: ExecutionGraph, 
    request: AgentRequest, 
    context: ExecutionContext
  ): Promise<string> {
    
    // Create a unique execution tracking ID for this whole run
    const executionId = crypto.randomUUID();
    const graphId = crypto.randomUUID();
    
    console.log(`[ExecutionCoordinator] Starting coordination for workflow ${context.workflowId}`);
    
    // Start Root Trace
    const traceId = await Tracer.startTrace(executionId, context.workflowId);

    await Tracer.withSpan({
      name: 'WorkflowExecution',
      kind: SpanKind.ROOT,
      traceId,
      workflowId: context.workflowId,
      correlationId: executionId,
    }, async (span) => {
      
      if (graph.groups.length > 0) {
        // Pass traceId down so dispatched jobs can link their spans
        await this.dispatchGroup(graph.groups[0], request, context, executionId, graphId, traceId, span.id);
      }
      
    });

    // In a real system, endTrace would be called when the workflow truly finishes.
    
    return executionId;
  }

  private async dispatchGroup(
    group: ExecutionGroup,
    request: AgentRequest,
    context: ExecutionContext,
    executionId: string,
    graphId: string,
    traceId: string,
    parentSpanId: string
  ): Promise<void> {
    for (const agentId of group.agentIds) {
      
      const job: RuntimeJob = {
        id: crypto.randomUUID(),
        workflowId: context.workflowId,
        executionId,
        graphId,
        nodeId: agentId,
        type: JobType.AGENT,
        priority: JobPriority.NORMAL,
        payload: {
          agentId,
          request: request as any,
          traceId,        // <-- Injecting traceId for worker to use
          parentSpanId    // <-- Injecting parentSpanId for worker to use
        }
      };

      await jobDispatcher.dispatch(job);
    }
  }

  /**
   * Schedules an ExecutionPlan for Autonomous execution.
   */
  public async coordinateAutonomous(planId: string, workflowId: string, repoPath: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    
    // Create the session (models removed, skip)
    // await (db as any).executionSession.create(...);
    console.log(`[ExecutionCoordinator] ExecutionSession models removed. Skipping session creation.`);

    const job: RuntimeJob = {
      id: crypto.randomUUID(),
      workflowId,
      type: "AUTONOMOUS_EXECUTION",
      priority: JobPriority.HIGH,
      payload: {
        planId,
        sessionId,
        repoPath
      }
    };

    await jobDispatcher.dispatch(job);
    return sessionId;
  }
}

export const executionCoordinator = new ExecutionCoordinator();
