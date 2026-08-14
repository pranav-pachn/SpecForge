import { AIProvider } from "../interfaces/AIProvider";
import { Capability } from "../interfaces/Capability";
import { ModelProfile } from "../interfaces/ModelProfile";
import { AIRequest } from "../interfaces/AIRequest";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, generateObject, streamText } from "ai";

export class OpenRouterProvider implements AIProvider {
  readonly id = "openrouter";
  private envKeyName = "OPENROUTER_API_KEY";

  getModels(): ModelProfile[] {
    return [
      {
        id: "anthropic/claude-3.5-sonnet",
        providerId: this.id,
        displayName: "Claude 3.5 Sonnet (OpenRouter)",
        contextWindow: 200000,
        maxOutputTokens: 8192,
        supportsStructuredOutput: true,
        supportsStreaming: true,
        capabilities: ["LONG_REASONING", "HEAVY_CODE_GEN"]
      }
    ];
  }

  supports(capability: Capability): boolean {
    return true;
  }

  isAvailable(): boolean {
    return !!process.env[this.envKeyName];
  }

  async generate(request: AIRequest, apiKey: string, modelProfile: ModelProfile): Promise<AIResponse> {
    const startTime = Date.now();
    const openrouter = createOpenAI({ 
      apiKey, 
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SpecForge'
      }
    });
    const model = openrouter(modelProfile.id);

    const options: any = {
      model,
      system: request.system,
      prompt: request.prompt,
    };
    if (request.temperature !== undefined) options.temperature = request.temperature;
    if (request.maxTokens !== undefined) options.maxTokens = request.maxTokens;

    if (request.schema) {
      options.schema = request.schema;
      const { object, usage } = await generateObject(options);
      return {
        object,
        provider: this.id,
        model: modelProfile.id,
        latencyMs: Date.now() - startTime,
        usage: { tokensIn: (usage as any)?.promptTokens || (usage as any)?.inputTokens || 0, tokensOut: (usage as any)?.completionTokens || (usage as any)?.outputTokens || 0 },
        cached: false,
        retryCount: 0
      };
    } else {
      const { text, usage, finishReason } = await generateText(options);
      return {
        text,
        provider: this.id,
        model: modelProfile.id,
        latencyMs: Date.now() - startTime,
        usage: { tokensIn: (usage as any)?.promptTokens || (usage as any)?.inputTokens || 0, tokensOut: (usage as any)?.completionTokens || (usage as any)?.outputTokens || 0 },
        cached: false,
        finishReason,
        retryCount: 0
      };
    }
  }

  async *stream(request: AIRequest, apiKey: string, modelProfile: ModelProfile): AsyncIterable<AIStreamChunk> {
    const openrouter = createOpenAI({ 
      apiKey, 
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'SpecForge'
      }
    });
    const model = openrouter(modelProfile.id);

    const options: any = {
      model,
      system: request.system,
      prompt: request.prompt,
    };
    if (request.temperature !== undefined) options.temperature = request.temperature;
    if (request.maxTokens !== undefined) options.maxTokens = request.maxTokens;

    const { textStream } = await streamText(options);
    for await (const chunk of textStream) {
      yield { text: chunk };
    }
  }
}
