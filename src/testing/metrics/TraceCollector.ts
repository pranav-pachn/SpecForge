export interface TraceStep {
  stage: string;
  duration: number;
  provider?: string;
  prompt?: string;
  success: boolean;
  repairLoops?: number;
}

export interface ExecutionTrace {
  workflowId: string;
  steps: TraceStep[];
}

export class TraceCollector {
  private traces: ExecutionTrace[] = [];

  recordTrace(workflowId: string, steps: TraceStep[]) {
    this.traces.push({ workflowId, steps });
  }

  getTraces(): ExecutionTrace[] {
    return this.traces;
  }

  clear() {
    this.traces = [];
  }
}
