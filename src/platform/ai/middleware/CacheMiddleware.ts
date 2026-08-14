import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import crypto from "crypto";

/**
 * Placeholder for semantic caching logic.
 * In Phase 4C+, this middleware will hash the prompt and check a fast data store (e.g. Redis)
 * before invoking the provider.
 */
export class CacheMiddleware implements GatewayMiddleware {
  async handle(context: GatewayContext, next: NextFunction): Promise<AIResponse> {
    // Basic structural cache check could go here
    // const hash = this.hashRequest(context.request);
    // const cached = await redis.get(hash);
    // if (cached) return { ...JSON.parse(cached), cached: true };

    const response = await next(context);
    
    // if (response.finishReason === 'stop') {
    //   await redis.set(hash, JSON.stringify(response), 'EX', 3600);
    // }

    return response;
  }

  async *handleStream(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk> {
    // Streaming cache is more complex, usually caches chunks as they arrive 
    // and replays them immediately on cache hit.
    yield* next(context);
  }

  private hashRequest(request: any): string {
    const data = JSON.stringify({ prompt: request.prompt, system: request.system });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
