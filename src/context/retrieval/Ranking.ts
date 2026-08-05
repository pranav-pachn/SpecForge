import { KnowledgeNode, RetrievedNode } from "../knowledge/Node";

export class Ranking {
  /**
   * Ranks nodes using a combined score:
   * 45% Vector Similarity
   * 30% Importance Score (intrinsic to the node type)
   * 25% Freshness (decay based on version or recency)
   */
  static rank(nodes: RetrievedNode[]): RetrievedNode[] {
    const maxVersion = Math.max(...nodes.map(n => n.version), 1);
    
    return nodes.map(node => {
      // 1. Similarity (0 to 1)
      const simScore = Math.max(0, node.similarity || 0);
      
      // 2. Importance (0 to 1)
      const impScore = node.importanceScore || 0.5;
      
      // 3. Freshness (0 to 1)
      // Nodes from newer versions get higher freshness.
      const freshnessScore = node.version / maxVersion;

      // Final weighted sum
      const finalScore = (simScore * 0.45) + (impScore * 0.30) + (freshnessScore * 0.25);
      
      return {
        ...node,
        finalScore
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }
}
