import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { providerHealthMonitor } from "../health/ProviderHealthMonitor";
import { keyManager } from "../KeyManager";

export class RetryMiddleware implements GatewayMiddleware {
  constructor(private maxRetries: number = 2) {}

  private isRetryable(error: any): boolean {
    // Retry on rate limits or 5xx server errors
    const status = error?.status;
    const msg = error?.message?.toLowerCase() || "";
    if (status === 429 || msg.includes("429") || msg.includes("rate limit")) return true;
    if (status >= 500 && status < 600) return true;
    return false;
  }

  async handle(context: GatewayContext, next: NextFunction): Promise<AIResponse> {
    while (context.retryCount <= this.maxRetries) {
      try {
        const response = await next(context);
        return {
          ...response,
          retryCount: context.retryCount
        };
      } catch (error: any) {
        const model = context.candidates[context.currentCandidateIndex];
        const providerId = model.providerId;
        const isRateLimit = this.isRetryable(error);

        // Record health
        providerHealthMonitor.recordFailure(providerId, isRateLimit);
        if (context.apiKey) {
          keyManager.recordFailure(providerId, context.apiKey, isRateLimit);
        }

        if (context.retryCount >= this.maxRetries || !isRateLimit) {
          throw error; // Rethrow to let FallbackMiddleware catch it
        }

        context.retryCount++;
        // Clear API key so ProviderMiddleware fetches a new one if available
        context.apiKey = undefined;
        
        // Wait before retry
        const backoffMs = Math.pow(2, context.retryCount) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error("Max retries exceeded");
  }

  async *handleStream(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk> {
    while (context.retryCount <= this.maxRetries) {
      try {
        yield* next(context);
        return; // If stream completes successfully, exit loop
      } catch (error: any) {
        const model = context.candidates[context.currentCandidateIndex];
        const providerId = model.providerId;
        const isRateLimit = this.isRetryable(error);

        providerHealthMonitor.recordFailure(providerId, isRateLimit);
        if (context.apiKey) {
          keyManager.recordFailure(providerId, context.apiKey, isRateLimit);
        }

        if (context.retryCount >= this.maxRetries || !isRateLimit) {
          throw error;
        }

        context.retryCount++;
        context.apiKey = undefined;
        
        const backoffMs = Math.pow(2, context.retryCount) * 1000 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    throw new Error("Max retries exceeded");
  }
}
