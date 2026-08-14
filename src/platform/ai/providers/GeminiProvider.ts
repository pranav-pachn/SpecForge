import { AIProvider } from "../interfaces/AIProvider";
import { Capability } from "../interfaces/Capability";
import { ModelProfile } from "../interfaces/ModelProfile";
import { AIRequest } from "../interfaces/AIRequest";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject, streamText } from "ai";

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  private envKeyName = "GEMINI_API_KEY";

  getModels(): ModelProfile[] {
    return [
      {
        id: "gemini-2.5-pro",
        providerId: this.id,
        displayName: "Gemini 2.5 Pro",
        contextWindow: 2000000,
        maxOutputTokens: 8192,
        supportsStructuredOutput: true,
        supportsStreaming: true,
        capabilities: ["LONG_REASONING", "FAST_STRUCTURED"]
      }
    ];
  }

  supports(capability: Capability): boolean {
    return true; // We map this at the router level, but theoretically it supports all
  }

  isAvailable(): boolean {
    return !!process.env[this.envKeyName];
  }

  async generate(request: AIRequest, apiKey: string, modelProfile: ModelProfile): Promise<AIResponse> {
    const startTime = Date.now();
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelProfile.id);

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
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google(modelProfile.id);

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
