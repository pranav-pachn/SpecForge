import { AIRequest } from "./interfaces/AIRequest";
import { AIResponse, AIStreamChunk } from "./interfaces/AIResponse";
import { capabilityRouter } from "./CapabilityRouter";
import { providerSelector } from "./ProviderSelector";
import { providerRegistry } from "./registry/ProviderRegistry";
import { keyManager } from "./KeyManager";

// Providers
import { GeminiProvider } from "./providers/GeminiProvider";
import { GroqProvider } from "./providers/GroqProvider";
import { CerebrasProvider } from "./providers/CerebrasProvider";
import { MistralProvider } from "./providers/MistralProvider";
import { OpenRouterProvider } from "./providers/OpenRouterProvider";
import { CohereProvider } from "./providers/CohereProvider";
import { modelRegistry } from "./registry/ModelRegistry";

// Middleware
import { GatewayPipeline } from "./middleware/GatewayPipeline";
import { MetricsMiddleware } from "./middleware/MetricsMiddleware";
import { CacheMiddleware } from "./middleware/CacheMiddleware";
import { RetryMiddleware } from "./middleware/RetryMiddleware";
import { FallbackMiddleware } from "./middleware/FallbackMiddleware";
import { ProviderMiddleware } from "./middleware/ProviderMiddleware";

import { Tracer, SpanKind, SnapshotType } from "../telemetry/Tracer";

export class AIGateway {
  private pipeline: GatewayPipeline;

  constructor() {
    this.pipeline = new GatewayPipeline();
    this.init();
  }

  private init() {
    // 1. Setup Pipeline
    this.pipeline.use(new MetricsMiddleware());
    this.pipeline.use(new CacheMiddleware());
    this.pipeline.use(new FallbackMiddleware());
    this.pipeline.use(new RetryMiddleware(2));
    this.pipeline.use(new ProviderMiddleware());

    // 2. Register Providers
    providerRegistry.register(new GeminiProvider());
    providerRegistry.register(new GroqProvider());
    providerRegistry.register(new CerebrasProvider());
    providerRegistry.register(new MistralProvider());
    providerRegistry.register(new OpenRouterProvider());
    providerRegistry.register(new CohereProvider());

    // 2. Refresh Model Registry
    modelRegistry.refresh();

    // 3. Register Keys (simplified for Sprint 1, reads from env)
    const registerEnvKeys = (providerId: string, envVar: string) => {
      const val = process.env[envVar];
      if (val) {
        const keys = val.split(',').map(k => k.trim()).filter(Boolean);
        keyManager.registerKeys(providerId, keys);
      }
    };

    registerEnvKeys('gemini', 'GEMINI_API_KEY');
    registerEnvKeys('groq', 'GROQ_API_KEY');
    registerEnvKeys('cerebras', 'CEREBRAS_API_KEY');
    registerEnvKeys('mistral', 'MISTRAL_API_KEY');
    registerEnvKeys('openrouter', 'OPENROUTER_API_KEY');
    registerEnvKeys('cohere', 'COHERE_API_KEY');
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const candidates = capabilityRouter.getCandidates(request.capability);
    if (candidates.length === 0) {
      throw new Error(`No candidates available for capability ${request.capability}`);
    }

    const executeGateway = async (parentSpanId?: string) => {
      const context = {
        request,
        candidates,
        currentCandidateIndex: 0,
        retryCount: 0,
        metrics: {},
        metadata: {}
      };
      // For Phase 11, the middleware itself would be further instrumented
      // to capture Provider spans and Provider/Prompt snapshots.
      return this.pipeline.execute(context);
    };

    if (request.traceId) {
      return await Tracer.withSpan({
        name: 'AIGateway',
        kind: SpanKind.GATEWAY,
        traceId: request.traceId,
        parentSpanId: request.parentSpanId,
        workflowId: 'unknown', // Typically we have it, passing placeholder for brevity
      }, async (span) => {
        return await executeGateway(span.id);
      });
    }

    return await executeGateway();
  }

  async generateObject<T>(request: AIRequest & { schema: any }): Promise<AIResponse<T>> {
    const candidates = capabilityRouter.getCandidates(request.capability);
    if (candidates.length === 0) {
      throw new Error(`No candidates available for capability ${request.capability}`);
    }

    const executeGateway = async (parentSpanId?: string) => {
      const context = {
        request,
        candidates,
        currentCandidateIndex: 0,
        retryCount: 0,
        metrics: {},
        metadata: {}
      };
      return this.pipeline.execute(context) as Promise<AIResponse<T>>;
    };

    if (request.traceId) {
      return await Tracer.withSpan({
        name: 'AIGateway',
        kind: SpanKind.GATEWAY,
        traceId: request.traceId,
        parentSpanId: request.parentSpanId,
        workflowId: 'unknown', // Typically we have it, passing placeholder for brevity
      }, async (span) => {
        return await executeGateway(span.id);
      });
    }

    return await executeGateway();
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const candidates = capabilityRouter.getCandidates(request.capability);
    if (candidates.length === 0) {
      throw new Error(`No candidates available for capability ${request.capability}`);
    }

    const context = {
      request,
      candidates,
      currentCandidateIndex: 0,
      retryCount: 0,
      metrics: {},
      metadata: {}
    };

    yield* this.pipeline.executeStream(context);
  }
}

export const aiGateway = new AIGateway();
