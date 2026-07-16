import { generateText } from "ai";
import { gatewayCache, generateCacheKey } from "./cache";
import { gatewayMetrics, MetricEvent } from "./metrics";
import { withRetry } from "./retry";
import { CapabilityType, ROUTER_CONFIG, resolveProvider, ProviderRoute } from "./router";

export interface GatewayRequest {
  capability: CapabilityType;
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GatewayResponse {
  text: string;
  cached: boolean;
}

class LLMGateway {
  /**
   * Executes an LLM request by routing it to the appropriate capability provider.
   * Handles caching, retries, fallbacks, and metrics collection transparently.
   */
  async execute(request: GatewayRequest): Promise<GatewayResponse> {
    const { capability, system, prompt, temperature, maxTokens } = request;
    const route = ROUTER_CONFIG[capability];

    if (!route) {
      throw new Error(`Capability ${capability} is not configured in the router.`);
    }

    // 1. Check Cache
    if (route.cacheTtlMs > 0) {
      const cacheKey = generateCacheKey(capability, system || "", prompt);
      const cachedResult = gatewayCache.get(cacheKey);
      if (cachedResult) {
        this.recordMetric({
          capability,
          provider: "cache",
          model: "memory",
          latency: 0,
          cacheHit: true,
          retryCount: 0,
          fallbackUsed: false,
        });
        return { text: cachedResult, cached: true };
      }
    }

    const startTime = Date.now();
    let finalProvider: ProviderRoute = route.primary;
    let fallbackUsed = false;
    let retryCount = 0;
    let resultText = "";

    try {
      // 2. Try Primary Provider with Retries
      const primaryResult = await withRetry(async (attempt) => {
        retryCount = attempt;
        const model = resolveProvider(route.primary);
        const options: any = { model, system, prompt };
        if (temperature !== undefined) options.temperature = temperature;
        if (maxTokens !== undefined) options.maxTokens = maxTokens;
        return await generateText(options);
      }, 2, 250); // 2 retries, 250ms base delay

      resultText = primaryResult.result.text;
      if (!resultText || resultText.trim() === "") {
        throw new Error("Primary provider returned empty response");
      }
    } catch (primaryError) {
      console.warn(`[Gateway] Primary provider failed for ${capability}. Triggering fallbacks...`);
      fallbackUsed = true;
      let fallbackSuccess = false;
      let lastFallbackError;

      // 3. Try Fallbacks
      for (const fallback of route.fallbacks) {
        try {
          const fallbackResult = await withRetry(async (attempt) => {
            retryCount += attempt; // accumulate retries across fallbacks
            finalProvider = fallback;
            const model = resolveProvider(fallback);
            const options: any = { model, system, prompt };
            if (temperature !== undefined) options.temperature = temperature;
            if (maxTokens !== undefined) options.maxTokens = maxTokens;
            return await generateText(options);
          }, 1, 250); // 1 retry for fallbacks
          
          resultText = fallbackResult.result.text;
          if (!resultText || resultText.trim() === "") {
            throw new Error(`Fallback provider ${fallback.provider} returned empty response`);
          }
          fallbackSuccess = true;
          break;
        } catch (fallbackError) {
          console.warn(`[Gateway] Fallback ${fallback.provider} failed for ${capability}.`);
          lastFallbackError = fallbackError;
        }
      }

      if (!fallbackSuccess) {
        throw lastFallbackError || primaryError;
      }
    }

    // 4. Update Cache
    if (route.cacheTtlMs > 0 && resultText) {
      const cacheKey = generateCacheKey(capability, system || "", prompt);
      gatewayCache.set(cacheKey, resultText, route.cacheTtlMs);
    }

    // 5. Record Metrics
    const latency = Date.now() - startTime;
    this.recordMetric({
      capability,
      provider: finalProvider.provider,
      model: finalProvider.model,
      latency,
      cacheHit: false,
      retryCount,
      fallbackUsed,
    });

    return { text: resultText, cached: false };
  }

  private recordMetric(event: Omit<MetricEvent, "requestId" | "timestamp">) {
    gatewayMetrics.record({
      ...event,
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
    });
  }
}

export const gateway = new LLMGateway();
