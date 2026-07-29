import { embed, embedMany, EmbeddingModel } from "ai";
import { gemini } from "../providers/gemini";
import { cohere } from "@ai-sdk/cohere";
import { healthTracker } from "./health";
import { withRetry } from "./retry";

export type EmbeddingProviderType = "gemini" | "cohere" | "openai";

export interface EmbeddingRoute {
  provider: EmbeddingProviderType;
  model: string;
}

export const EMBEDDING_CONFIG = {
  primary: { provider: "cohere", model: "embed-english-v3.0" } as EmbeddingRoute,
  fallbacks: [
    { provider: "gemini", model: "text-embedding-004" } as EmbeddingRoute
  ]
};

function resolveEmbeddingProvider(route: EmbeddingRoute): EmbeddingModel {
  switch (route.provider) {
    case "gemini":
      return gemini.textEmbeddingModel(route.model);
    case "cohere":
      return cohere.embedding(route.model);
    case "openai":
      // Fallback require openai dynamically to avoid circular/unnecessary deps if unused
      const { openai } = require("@ai-sdk/openai");
      return openai.embedding(route.model);
    default:
      throw new Error(`Unknown embedding provider: ${route.provider}`);
  }
}

export class EmbeddingGateway {
  async embedText(text: string): Promise<number[]> {
    let finalProvider = EMBEDDING_CONFIG.primary;
    let fallbackUsed = false;
    
    try {
      if (!healthTracker.isHealthy(finalProvider.provider)) {
        throw new Error(`Primary embedding provider ${finalProvider.provider} is down/rate-limited.`);
      }

      const startTime = Date.now();
      const result = await withRetry(async () => {
        const model = resolveEmbeddingProvider(finalProvider);
        return await embed({ model, value: text });
      }, 2, 250);

      healthTracker.recordSuccess(finalProvider.provider, Date.now() - startTime);
      return result.result.embedding;
    } catch (primaryError: any) {
      if (!primaryError.message.includes('down/rate-limited')) {
        healthTracker.recordFailure(finalProvider.provider, primaryError);
      }
      
      fallbackUsed = true;
      let lastError;

      for (const fallback of EMBEDDING_CONFIG.fallbacks) {
        if (!healthTracker.isHealthy(fallback.provider)) continue;
        
        try {
          const startTime = Date.now();
          const result = await withRetry(async () => {
            finalProvider = fallback;
            const model = resolveEmbeddingProvider(fallback);
            return await embed({ model, value: text });
          }, 1, 250);
          
          healthTracker.recordSuccess(fallback.provider, Date.now() - startTime);
          return result.result.embedding;
        } catch (fallbackError) {
          healthTracker.recordFailure(fallback.provider, fallbackError);
          lastError = fallbackError;
        }
      }

      throw lastError || primaryError;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    let finalProvider = EMBEDDING_CONFIG.primary;
    
    try {
      if (!healthTracker.isHealthy(finalProvider.provider)) {
        throw new Error(`Primary embedding provider ${finalProvider.provider} is down/rate-limited.`);
      }

      const startTime = Date.now();
      const result = await withRetry(async () => {
        const model = resolveEmbeddingProvider(finalProvider);
        return await embedMany({ model, values: texts });
      }, 2, 250);

      healthTracker.recordSuccess(finalProvider.provider, Date.now() - startTime);
      return result.result.embeddings;
    } catch (primaryError: any) {
      if (!primaryError.message.includes('down/rate-limited')) {
        healthTracker.recordFailure(finalProvider.provider, primaryError);
      }
      
      let lastError;

      for (const fallback of EMBEDDING_CONFIG.fallbacks) {
        if (!healthTracker.isHealthy(fallback.provider)) continue;
        
        try {
          const startTime = Date.now();
          const result = await withRetry(async () => {
            finalProvider = fallback;
            const model = resolveEmbeddingProvider(fallback);
            return await embedMany({ model, values: texts });
          }, 1, 250);
          
          healthTracker.recordSuccess(fallback.provider, Date.now() - startTime);
          return result.result.embeddings;
        } catch (fallbackError) {
          healthTracker.recordFailure(fallback.provider, fallbackError);
          lastError = fallbackError;
        }
      }

      throw lastError || primaryError;
    }
  }
}

export const embeddingGateway = new EmbeddingGateway();
