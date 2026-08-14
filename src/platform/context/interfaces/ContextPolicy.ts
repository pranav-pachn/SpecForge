export interface ContextPolicy {
  sources: string[];
  budget: number;       // e.g. 8000
  priority: string[];   // e.g. ["MEMORY", "RAG"]
  compression: boolean; // true if low priority items can be compressed
  reranking: boolean;   // true if results should be semantically reranked
}
