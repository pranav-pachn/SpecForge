import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { PlatformEventBus } from "../../events/PlatformEventBus";
import { EventFactory } from "../../events/factory/EventFactory";

export class FallbackMiddleware implements GatewayMiddleware {
  async handle(context: GatewayContext, next: NextFunction): Promise<AIResponse> {
    while (context.currentCandidateIndex < context.candidates.length) {
      const candidate = context.candidates[context.currentCandidateIndex];
      try {
        const response = await next(context);
        
        // If we succeeded and we had fallen back from a previous candidate, emit recovery event
        if (context.currentCandidateIndex > 0) {
          PlatformEventBus.publish(EventFactory.aiProviderRecovered({ providerId: candidate.providerId }, {}));
        }
        
        return response;
      } catch (error: any) {
        const failedProviderId = candidate.providerId;
        const isRateLimit = error?.status === 429 || error?.message?.includes("429");
        
        // Emit failure event
        PlatformEventBus.publish(EventFactory.aiProviderFailed({ 
          providerId: failedProviderId, 
          error: error.message || "Unknown error",
          isRateLimit
        }, {}));

        // Try the next candidate
        context.currentCandidateIndex++;
        if (context.currentCandidateIndex < context.candidates.length) {
          const nextCandidate = context.candidates[context.currentCandidateIndex];
          // Clear API key since we're switching providers
          context.apiKey = undefined;
          
          PlatformEventBus.publish(EventFactory.aiProviderFallback({
            failedProviderId,
            fallbackProviderId: nextCandidate.providerId,
            reason: error.message || "Provider failed after retries"
          }, {}));
        } else {
          // No more fallbacks
          throw error;
        }
      }
    }
    throw new Error("All fallback providers exhausted.");
  }

  async *handleStream(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk> {
    while (context.currentCandidateIndex < context.candidates.length) {
      const candidate = context.candidates[context.currentCandidateIndex];
      try {
        yield* next(context);
        
        if (context.currentCandidateIndex > 0) {
          PlatformEventBus.publish(EventFactory.aiProviderRecovered({ providerId: candidate.providerId }, {}));
        }
        return;
      } catch (error: any) {
        const failedProviderId = candidate.providerId;
        const isRateLimit = error?.status === 429 || error?.message?.includes("429");
        
        PlatformEventBus.publish(EventFactory.aiProviderFailed({ 
          providerId: failedProviderId, 
          error: error.message || "Unknown error",
          isRateLimit
        }, {}));

        context.currentCandidateIndex++;
        if (context.currentCandidateIndex < context.candidates.length) {
          const nextCandidate = context.candidates[context.currentCandidateIndex];
          context.apiKey = undefined;
          
          PlatformEventBus.publish(EventFactory.aiProviderFallback({
            failedProviderId,
            fallbackProviderId: nextCandidate.providerId,
            reason: error.message || "Provider failed after retries"
          }, {}));
        } else {
          throw error;
        }
      }
    }
    throw new Error("All fallback providers exhausted.");
  }
}
