import { embeddingGateway } from "../ai/gateway/embeddingRouter";

export class EmbeddingProvider {
  static async embedText(text: string): Promise<number[]> {
    return await embeddingGateway.embedText(text);
  }

  static async embedBatch(texts: string[]): Promise<number[][]> {
    return await embeddingGateway.embedBatch(texts);
  }
}
