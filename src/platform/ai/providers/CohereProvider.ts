import { AIProvider } from "../interfaces/AIProvider";
import { Capability } from "../interfaces/Capability";
import { ModelProfile } from "../interfaces/ModelProfile";
import { AIRequest } from "../interfaces/AIRequest";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";

// Cohere embeddings aren't supported via standard ai-sdk generateText,
// so this provider handles the specialized embedding call directly.
export class CohereProvider implements AIProvider {
  readonly id = "cohere";
  private envKeyName = "COHERE_API_KEY";

  getModels(): ModelProfile[] {
    return [
      {
        id: "cohere-embed-english-v3.0",
        providerId: this.id,
        displayName: "Cohere Embed English v3.0",
        contextWindow: 512,
        maxOutputTokens: 1024,
        supportsStructuredOutput: false,
        supportsStreaming: false,
        capabilities: ["EMBEDDING"]
      }
    ];
  }

  supports(capability: Capability): boolean {
    return capability === 'EMBEDDING';
  }

  isAvailable(): boolean {
    return !!process.env[this.envKeyName];
  }

  async generate(request: AIRequest, apiKey: string, modelProfile: ModelProfile): Promise<AIResponse> {
    const startTime = Date.now();
    
    // Manual REST call to Cohere API for embeddings since standard generateText doesn't apply
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        texts: [request.prompt],
        model: modelProfile.id,
        input_type: "search_document"
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.embeddings[0]; // array of numbers

    return {
      object: embedding,
      provider: this.id,
      model: modelProfile.id,
      latencyMs: Date.now() - startTime,
      usage: { tokensIn: data.meta?.billed_units?.input_tokens || 0, tokensOut: 0 },
      cached: false,
      retryCount: 0
    };
  }

  async *stream(request: AIRequest, apiKey: string, modelProfile: ModelProfile): AsyncIterable<AIStreamChunk> {
    throw new Error("CohereProvider does not support streaming.");
  }
}
