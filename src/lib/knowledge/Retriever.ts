import { EmbeddingProvider } from "./EmbeddingProvider";
import { VectorRepository } from "./database/VectorRepository";
import { Relationships } from "./Relationships";
import { Ranking } from "./Ranking";
import { RetrievedNode } from "./Node";

export class Retriever {
  /**
   * Two-Step Retrieval:
   * 1. Semantic Vector Search
   * 2. Graph Relationship Expansion
   * 3. Scoring (Similarity + Importance + Freshness)
   */
  static async search(options: {
    workflowId: string;
    query: string;
    limit?: number;
    types?: string[];
  }): Promise<RetrievedNode[]> {
    const limit = options.limit || 8;
    
    // Step 1: Embed Query
    const queryEmbedding = await EmbeddingProvider.embedText(options.query);
    
    // Step 2: Semantic Vector Search
    const semanticNodes = await VectorRepository.search(
      options.workflowId, 
      queryEmbedding, 
      limit, 
      options.types
    );

    // Step 3: Expand Relationships (fetch nodes connected to semantic hits)
    const expandedNodes = await Relationships.expand(semanticNodes);

    // Step 4: Rank and Deduplicate
    const uniqueNodesMap = new Map<string, RetrievedNode>();
    for (const node of expandedNodes) {
      // Keep the one with highest similarity if there are duplicates (though IDs should be unique here)
      if (!uniqueNodesMap.has(node.id) || (uniqueNodesMap.get(node.id)!.similarity < node.similarity)) {
        uniqueNodesMap.set(node.id, node);
      }
    }

    const uniqueNodes = Array.from(uniqueNodesMap.values());
    const rankedNodes = Ranking.rank(uniqueNodes);

    // Return the top K nodes after graph expansion and ranking
    return rankedNodes.slice(0, limit);
  }
}
