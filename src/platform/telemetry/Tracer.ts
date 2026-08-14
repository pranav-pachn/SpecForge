export enum SpanKind {
  ROOT = 'ROOT',
  GATEWAY = 'GATEWAY',
  AGENT = 'AGENT',
  TOOL = 'TOOL',
  PROVIDER = 'PROVIDER',
  CONTEXT = 'CONTEXT',
  EVALUATION = 'EVALUATION',
  JOB = 'JOB'
}

export enum SpanStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum SnapshotType {
  PROMPT = 'PROMPT',
  DECISION = 'DECISION',
  ERROR = 'ERROR'
}

export interface SpanOptions {
  name: string;
  kind: SpanKind;
  traceId: string;
  parentSpanId?: string;
  correlationId?: string;
  causationId?: string;
  workflowId: string;
}

export class Span {
  public readonly id: string;
  constructor(id: string, public readonly options: SpanOptions) {
    this.id = id;
  }
  public async addSnapshot(type: SnapshotType, payload: any): Promise<void> {}
  public getSnapshots() { return []; }
}

export class Tracer {
  static async withSpan<T>(options: SpanOptions, fn: (span: Span) => Promise<T>): Promise<T> {
    const span = new Span('mock-span-id', options);
    return await fn(span);
  }

  static async startTrace(executionId: string, workflowId: string): Promise<string> {
    return 'mock-trace-id';
  }
  
  static async endTrace(traceId: string, status: SpanStatus): Promise<void> {}
}
