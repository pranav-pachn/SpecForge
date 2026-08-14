import { SpanKind } from './Tracer';
type WorkflowSpan = any;

export interface TraceMetrics {
  criticalPath: WorkflowSpan[];
  providerTime: number;
  contextTime: number;
  evaluationTime: number;
  idleTime: number;
  queueTime: number;
}

export interface AssembledTrace {
  traceId: string;
  executionId: string;
  workflowId: string;
  totalDurationMs: number;
  rootSpan: WorkflowSpan & { children?: any[] };
  metrics: TraceMetrics;
}

export class TraceAssembler {
  static async assemble(traceId: string): Promise<AssembledTrace | null> {
    console.log(`[TraceAssembler] Trace models removed. Returning null.`);
    return null;
  }
}
