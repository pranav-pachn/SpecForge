import { AIRequest } from "../interfaces/AIRequest";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { ModelProfile } from "../interfaces/ModelProfile";

export interface GatewayMetrics {
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface GatewayContext {
  request: AIRequest;
  candidates: ModelProfile[];
  currentCandidateIndex: number;
  selectedModel?: ModelProfile;
  selectedProvider?: string;
  apiKey?: string;
  retryCount: number;
  metrics: GatewayMetrics;
  metadata: Record<string, unknown>;
}

export type NextFunction = (context: GatewayContext) => Promise<AIResponse>;
export type NextStreamFunction = (context: GatewayContext) => AsyncIterable<AIStreamChunk>;

export interface GatewayMiddleware {
  handle(context: GatewayContext, next: NextFunction): Promise<AIResponse>;
  handleStream?(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk>;
}
