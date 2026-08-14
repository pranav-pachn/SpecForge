import { Chunk } from "./Chunker";

export class VectorStore {
  async store(documentId: string, workflowId: string, chunks: Chunk[], embeddings: number[][]): Promise<void> {
    console.log(`[VectorStore] ContextChunk models removed. Skipping store.`);
  }

  async similaritySearch(embedding: number[], workflowId: string, limit: number = 10): Promise<Array<any>> {
    console.log(`[VectorStore] ContextChunk models removed. Returning empty results.`);
    return [];
  }

  async deleteByDocument(documentId: string): Promise<void> {
    console.log(`[VectorStore] ContextChunk models removed. Skipping delete.`);
  }
}

export const vectorStore = new VectorStore();
