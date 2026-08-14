import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { PlatformEventBus } from "../../events/PlatformEventBus";
import { EventFactory } from "../../events/factory/EventFactory";
import { providerHealthMonitor } from "../health/ProviderHealthMonitor";

export class MetricsMiddleware implements GatewayMiddleware {
  async handle(context: GatewayContext, next: NextFunction): Promise<AIResponse> {
    const response = await next(context);
    
    // Extract info
    const modelId = response.model;
    const providerId = response.provider;

    // Record health metrics
    providerHealthMonitor.recordSuccess(providerId, response.latencyMs);

    // Emit domain events
    PlatformEventBus.publish(EventFactory.aiRequestCompleted({
      providerId,
      modelId,
      latencyMs: response.latencyMs
    }, {}));

    if (response.usage && (response.usage.tokensIn > 0 || response.usage.tokensOut > 0)) {
      PlatformEventBus.publish(EventFactory.aiTokensConsumed({
        providerId,
        modelId,
        tokensIn: response.usage.tokensIn,
        tokensOut: response.usage.tokensOut
      }, {}));
    }

    return response;
  }

  async *handleStream(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk> {
    const startTime = Date.now();
    // For streams, we yield the chunks and compute metrics at the end, if available.
    // However, ai-sdk's streamText provides usage after the stream closes. We would need to intercept it.
    // In this simple middleware, we'll just track latency to the first chunk and completion.
    
    let firstChunkTime = 0;
    let chunks = 0;
    
    try {
      for await (const chunk of next(context)) {
        if (chunks === 0) {
          firstChunkTime = Date.now();
        }
        chunks++;
        yield chunk;
      }
      
      const totalLatency = Date.now() - startTime;
      const model = context.candidates[context.currentCandidateIndex];
      
      providerHealthMonitor.recordSuccess(model.providerId, totalLatency);
      
      PlatformEventBus.publish(EventFactory.aiRequestCompleted({
        providerId: model.providerId,
        modelId: model.id,
        latencyMs: totalLatency
      }, {}));
      
    } catch (error) {
      throw error;
    }
  }
}
