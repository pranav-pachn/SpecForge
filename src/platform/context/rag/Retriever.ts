import { embeddingService } from "./EmbeddingService";
import { vectorStore } from "./VectorStore";
import { ContextItem } from "../interfaces/RetrievedContext";
import { ContextPolicy } from "../interfaces/ContextPolicy";

export class Retriever {
  async retrieve(query: string, workflowId: string, policy: ContextPolicy): Promise<ContextItem[]> {
    // 1. Embed the query
    const queryVector = await embeddingService.embed(query);

    // 2. Perform similarity search (limit to 20 for initial pass)
    // The VectorStore returns items with `distance`, where lower is better.
    // We convert distance to a score (0 to 1, where 1 is exact match).
    const results = await vectorStore.similaritySearch(queryVector, workflowId, 20);

    // 3. Map to ContextItem
    return results.map(chunk => {
      // distance is usually between 0 (identical) and 2 (opposite) for cosine distance.
      // score = 1 - (distance / 2) -> ranges from 0 to 1
      const score = Math.max(0, 1 - (chunk.distance / 2));
      
      // Calculate freshness based on chunk creation date. (0-1 scale)
      // E.g., drops by 0.1 every 7 days.
      const ageDays = (Date.now() - chunk.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const freshness = Math.max(0, 1 - (ageDays / 70)); // 0 after 70 days

      return {
        source: "RAG",
        provider: "RAG",
        retrievalMethod: "Vector Search",
        content: chunk.content,
        score,
        confidence: 0.8, // Baseline confidence for RAG chunks
        freshness,
        sourceId: chunk.documentId,
        metadata: {
          chunkIndex: chunk.chunkIndex
        }
      };
    });
  }
}

export const retriever = new Retriever();
