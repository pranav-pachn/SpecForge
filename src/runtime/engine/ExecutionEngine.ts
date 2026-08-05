import { ExecutionGraph } from './ExecutionGraph';
import { ExecutionState } from './ExecutionState';
import { AgentRequest } from '../interfaces/AgentRequest';
import { ExecutionContext } from '../context/ExecutionContext';
import { MiddlewarePipeline } from '../executor/MiddlewarePipeline';
import { RuntimeRegistry } from '../RuntimeRegistry';
import { RuntimeEvents } from '../RuntimeEvents';
import { CheckpointWriter } from '../checkpoint/CheckpointWriter';
import { createSnapshot } from '../checkpoint/ExecutionSnapshot';
import { AgentStateManager, ExecutionStatus } from '../state/AgentStateManager';

export class ExecutionEngine {
  constructor(
    private pipeline: MiddlewarePipeline,
    private runtimeEvents: RuntimeEvents
  ) {}

  async execute(graph: ExecutionGraph, state: ExecutionState, request: AgentRequest, context: ExecutionContext): Promise<void> {
    const registry = RuntimeRegistry.getInstance();
    state.status = 'RUNNING';

    for (const group of graph.groups) {
      const promises = group.agentIds.map(async (agentId) => {
        if (state.completedAgents.has(agentId)) {
          return; // Skip already completed (checkpoint resume)
        }

        const agent = registry.getAgent(agentId);
        this.runtimeEvents.emitAgentStarted(context.workflowId, agentId);
        
        // Create tracking state in DB
        const executionId = await AgentStateManager.createExecution(context.workflowId, agentId);
        await AgentStateManager.transition(executionId, ExecutionStatus.RUNNING);

        try {
          const result = await this.pipeline.execute(agent, request, context);

          if (result.errors && result.errors.length > 0) {
            state.failedAgents.add(agentId);
            this.runtimeEvents.emitAgentFailed(context.workflowId, agentId, result.errors[0]);
            await AgentStateManager.transition(executionId, ExecutionStatus.FAILED, { error: result.errors[0].message });
            throw result.errors[0]; // Fail fast within the group
          } else {
            state.completedAgents.add(agentId);
            this.runtimeEvents.emitAgentCompleted(context.workflowId, agentId);
            await AgentStateManager.transition(executionId, ExecutionStatus.COMPLETED, { durationMs: result.metrics?.durationMs });
          }
        } catch (err: any) {
          state.failedAgents.add(agentId);
          if (err.name === 'AgentCancelledError') {
            this.runtimeEvents.emitAgentCancelled(context.workflowId, agentId);
            state.status = 'CANCELLED';
            await AgentStateManager.transition(executionId, ExecutionStatus.CANCELLED);
          } else if (err.name === 'AgentTimeoutError') {
            this.runtimeEvents.emitAgentFailed(context.workflowId, agentId, err);
            state.status = 'TIMEOUT';
            await AgentStateManager.transition(executionId, ExecutionStatus.TIMEOUT);
          } else if (err.name === 'AgentPausedError') {
            // Emitted by HumanApprovalGate
            state.status = 'PAUSED';
            await AgentStateManager.transition(executionId, ExecutionStatus.PAUSED);
          } else {
            this.runtimeEvents.emitAgentFailed(context.workflowId, agentId, err);
            state.status = 'FAILED';
            await AgentStateManager.transition(executionId, ExecutionStatus.FAILED, { error: err.message });
          }
          throw err;
        }
      });

      // Execute all agents in the group concurrently
      const results = await Promise.allSettled(promises);

      // Save a checkpoint after the group finishes
      const snapshot = createSnapshot(context, Array.from(state.completedAgents));
      await CheckpointWriter.save(snapshot);

      // If any agent failed, we fail the engine run
      const failed = results.find(r => r.status === 'rejected');
      if (failed) {
         throw (failed as PromiseRejectedResult).reason;
      }
      
      // If paused, we pause the engine run
      if ((state.status as string) === 'PAUSED') {
         throw new Error('Pipeline execution paused for approval');
      }
    }

    state.status = 'COMPLETED';
  }
}
