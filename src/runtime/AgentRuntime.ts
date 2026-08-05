import { AgentRequest } from './interfaces/AgentRequest';
import { ExecutionContext } from './context/ExecutionContext';
import { MiddlewarePipeline } from './executor/MiddlewarePipeline';
import { CapabilityMiddleware } from './executor/CapabilityMiddleware';
import { LoggingMiddleware } from './executor/LoggingMiddleware';
import { RetryMiddleware } from './executor/RetryMiddleware';
import { TimeoutMiddleware } from './executor/TimeoutMiddleware';
import { StreamingMiddleware } from './streaming/StreamingMiddleware';
import { QuotaMiddleware } from './executor/QuotaMiddleware';
import { HumanApprovalGate } from './gates/HumanApprovalGate';
import { RuntimeEvents } from './RuntimeEvents';
import { EventBus } from '../workflow/engine/EventBus';
import { ExecutionGraph } from './engine/ExecutionGraph';
import { ExecutionState } from './engine/ExecutionState';
import { ExecutionEngine } from './engine/ExecutionEngine';
import { DefaultRetryPolicy } from './RetryPolicy';
import { CheckpointLoader } from './checkpoint/CheckpointLoader';
import { CheckpointWriter } from './checkpoint/CheckpointWriter';

export interface RuntimeHealth {
  registryLoaded: boolean;
  schedulerReady: boolean;
  checkpointEnabled: boolean;
  streamingEnabled: boolean;
  quotaEnabled: boolean;
}

export class AgentRuntime {
  private pipeline: MiddlewarePipeline;
  private runtimeEvents: RuntimeEvents;
  private executionEngine: ExecutionEngine;

  constructor(eventBus: EventBus) {
    this.runtimeEvents = new RuntimeEvents(eventBus);
    
    // Subscribe UsageRecorder
    // Usage tracking is now bridged to the PlatformEventBus and handled by UsageSubscriber

    // Explicit Middleware Ordering:
    // 1. LoggingMiddleware (starts tracking)
    // 2. CapabilityMiddleware (checks permissions)
    // 3. QuotaMiddleware (enforces resource limits)
    // 4. HumanApprovalGate (suspends if human review needed)
    // 5. RetryMiddleware (handles transient failures)
    // 6. TimeoutMiddleware (enforces time limits)
    // 7. StreamingMiddleware (manages real-time emission)
    // 8. AgentExecutor (business logic)
    
    this.pipeline = new MiddlewarePipeline()
      .use(new LoggingMiddleware())
      .use(new CapabilityMiddleware())
      .use(new QuotaMiddleware())
      .use(new HumanApprovalGate(this.runtimeEvents))
      .use(new RetryMiddleware(undefined, this.runtimeEvents))
      .use(new TimeoutMiddleware())
      .use(new StreamingMiddleware(this.runtimeEvents));

    this.executionEngine = new ExecutionEngine(this.pipeline, this.runtimeEvents);
  }

  async runGraph(graph: ExecutionGraph, request: AgentRequest, context: ExecutionContext): Promise<ExecutionState> {
    const state = new ExecutionState();
    
    // In Phase 3C this will load from CheckpointManager if a run is already established
    const checkpoint = await CheckpointLoader.loadLatest(context.workflowId);
    if (checkpoint) {
      state.completedAgents = new Set(checkpoint.completedAgents);
      context.artifacts = { ...context.artifacts, ...checkpoint.artifacts };
    }
    
    await this.executionEngine.execute(graph, state, request, context);
    
    return state;
  }

  async resume(workflowId: string, graph: ExecutionGraph, request: AgentRequest, context: ExecutionContext): Promise<ExecutionState> {
    console.log(`[AgentRuntime] Resuming workflow ${workflowId} from latest checkpoint...`);
    // Checkpoint loading is handled in runGraph
    return this.runGraph(graph, request, context);
  }

  health(): RuntimeHealth {
    return {
      registryLoaded: true,
      schedulerReady: true,
      checkpointEnabled: true,
      streamingEnabled: true, // Will be functionally true after Track 5
      quotaEnabled: true // Will be functionally true after Track 6
    };
  }
}
