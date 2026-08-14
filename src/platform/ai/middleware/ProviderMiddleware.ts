import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { providerRegistry } from "../registry/ProviderRegistry";
import { keyManager } from "../KeyManager";
import { promptRegistryService } from "../../prompts/PromptRegistryService";

export class ProviderMiddleware implements GatewayMiddleware {
  async handle(context: GatewayContext, next: NextFunction): Promise<AIResponse> {
    const model = context.candidates[context.currentCandidateIndex];
    if (!model) {
      throw new Error("No candidate model available to execute.");
    }
    const provider = providerRegistry.get(model.providerId);
    if (!provider) {
      throw new Error(`Provider ${model.providerId} not found.`);
    }

    const apiKey = context.apiKey || keyManager.getHealthyKey(model.providerId);
    if (!apiKey) {
      throw new Error(`No healthy API key found for provider ${model.providerId}.`);
    }
    
    // Store selected execution state for retry/fallback/metrics contexts
    context.apiKey = apiKey;
    context.selectedModel = model;
    context.selectedProvider = model.providerId;

    // Load Prompt Bundle if variables are provided or prompt is missing
    if (context.request.variables || !context.request.prompt) {
      const bundle = await promptRegistryService.getBundle(context.request.capability, model.providerId, model.id);
      if (bundle) {
        context.request.system = bundle.systemPrompt;
        let finalPrompt = bundle.template;
        if (context.request.variables) {
          for (const [k, v] of Object.entries(context.request.variables)) {
            finalPrompt = finalPrompt.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          }
        }
        context.request.prompt = finalPrompt;
        
        // Merge metadata overrides
        if (bundle.metadata.temperature !== undefined) context.request.temperature = bundle.metadata.temperature;
        if (bundle.metadata.maxTokens !== undefined) context.request.maxTokens = bundle.metadata.maxTokens;
      } else if (!context.request.prompt) {
        throw new Error(`No active prompt bundle found for capability ${context.request.capability} and no fallback prompt string provided.`);
      }
    }

    const response = await provider.generate(context.request, apiKey, model);
    return response;
  }

  async *handleStream(context: GatewayContext, next: NextStreamFunction): AsyncIterable<AIStreamChunk> {
    const model = context.candidates[context.currentCandidateIndex];
    if (!model) {
      throw new Error("No candidate model available to execute.");
    }
    const provider = providerRegistry.get(model.providerId);
    if (!provider) {
      throw new Error(`Provider ${model.providerId} not found.`);
    }

    const apiKey = context.apiKey || keyManager.getHealthyKey(model.providerId);
    if (!apiKey) {
      throw new Error(`No healthy API key found for provider ${model.providerId}.`);
    }

    context.apiKey = apiKey;
    context.selectedModel = model;
    context.selectedProvider = model.providerId;

    if (context.request.variables || !context.request.prompt) {
      const bundle = await promptRegistryService.getBundle(context.request.capability, model.providerId, model.id);
      if (bundle) {
        context.request.system = bundle.systemPrompt;
        let finalPrompt = bundle.template;
        if (context.request.variables) {
          for (const [k, v] of Object.entries(context.request.variables)) {
            finalPrompt = finalPrompt.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
          }
        }
        context.request.prompt = finalPrompt;
        
        if (bundle.metadata.temperature !== undefined) context.request.temperature = bundle.metadata.temperature;
        if (bundle.metadata.maxTokens !== undefined) context.request.maxTokens = bundle.metadata.maxTokens;
      } else if (!context.request.prompt) {
        throw new Error(`No active prompt bundle found for capability ${context.request.capability} and no fallback prompt string provided.`);
      }
    }

    yield* provider.stream(context.request, apiKey, model);
  }
}
