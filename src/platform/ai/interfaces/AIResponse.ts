export interface AIResponse<T = any> {
  text?: string;
  object?: T;
  usage?: {
    tokensIn: number;
    tokensOut: number;
  };
  provider: string;
  model: string;
  latencyMs: number;
  cached: boolean;
  finishReason?: string;
  warnings?: string[];
  requestId?: string;
  retryCount: number;
}

export interface AIStreamChunk {
  text: string;
}
