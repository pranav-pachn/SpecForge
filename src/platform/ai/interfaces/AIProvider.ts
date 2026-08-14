import { Capability } from "./Capability";
import { AIRequest } from "./AIRequest";
import { AIResponse, AIStreamChunk } from "./AIResponse";
import { ModelProfile } from "./ModelProfile";

export interface AIProvider {
  readonly id: string;
  getModels(): ModelProfile[];
  supports(capability: Capability): boolean;
  generate(request: AIRequest, apiKey: string, model: ModelProfile): Promise<AIResponse>;
  stream(request: AIRequest, apiKey: string, model: ModelProfile): AsyncIterable<AIStreamChunk>;
  isAvailable(): boolean;
}
