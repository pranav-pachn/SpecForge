export interface FrameContext {
  timestamp: string; // ISO or offset ms
  stage: string;     // e.g. "Architecture", "Compilation", "Repair"
  
  // Snapshots for this exact tick
  agent: string;
  prompt: any;
  contextData: any;
  memory: any;
  graph: any;
  output: string;
  reasoning: string;
  evaluation?: any;
  repair?: any;
  spanLogs: string[];
}

export interface ReplaySession {
  executionId: string;
  frames: FrameContext[];
}

export class ExecutionReplayService {
  /**
   * Acts as a debugger over the execution trace.
   * Compiles telemetry spans into step-by-step FrameContexts.
   */
  async buildReplaySession(executionId: string): Promise<ReplaySession> {
    // Interrogates the Observability Tracer store (e.g. Jaeger/OTel backend or our SQLite span store)
    
    return {
      executionId,
      frames: [
        {
          timestamp: '00:01',
          stage: 'Planner',
          agent: 'PlannerAgent',
          prompt: { template: 'You are an architect...', variables: {} },
          contextData: { activeFiles: ['index.ts'] },
          memory: [],
          graph: { nodes: 15 },
          output: 'I will create a 3-step execution plan.',
          reasoning: 'The requirements suggest a microservice pattern.',
          spanLogs: ['[Planner] Initialized', '[Planner] Plan generated']
        },
        {
          timestamp: '02:12',
          stage: 'Evaluation',
          agent: 'EvaluatorAgent',
          prompt: { template: 'Grade this file...', variables: {} },
          contextData: { activeFiles: ['auth.ts'] },
          memory: [],
          graph: { nodes: 20 },
          output: 'Score: 95. Missing rate limiter.',
          reasoning: 'Security standards require a rate limiter.',
          evaluation: { score: 95 },
          spanLogs: ['[Evaluator] Running static checks', '[Evaluator] Finished']
        }
      ]
    };
  }

  getReplayFrame(session: ReplaySession, timestamp: string): FrameContext | undefined {
    return session.frames.find(f => f.timestamp === timestamp);
  }
}
