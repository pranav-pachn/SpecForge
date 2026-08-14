import { aiGateway } from "../../ai/AIGateway";

export class EmbeddingService {
  /**
   * Generates an embedding for a single text chunk.
   */
  async embed(text: string): Promise<number[]> {
    const response = await aiGateway.generate({
      capability: "EMBEDDING",
      system: "",
      prompt: text
    });

    if (!Array.isArray(response.object)) {
      throw new Error("Expected embedding array from AI Gateway");
    }

    return response.object as number[];
  }

  /**
   * Batch embeds multiple text chunks. 
   * (Uses sequential calls for now; ideally the provider supports native batching)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in small batches to respect rate limits if needed
    for (const text of texts) {
      const vec = await this.embed(text);
      embeddings.push(vec);
    }
    
    return embeddings;
  }
}

export const embeddingService = new EmbeddingService();
