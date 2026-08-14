import { EntityGraphService } from "../memory/graph/EntityGraphService";
import { NormalizedChange } from "./interfaces";

export class ImpactAnalyzer {
  static async analyze(change: NormalizedChange) {
    // If we have an exact entity ID we would use it, but since we have a normalized text like "Redis", 
    // we might need to do a fuzzy search on the graph nodes first.
    // For simplicity, let's assume the source maps directly to a node type or ID.
    // In a real system, we'd query the DB for the closest matching node.
    
    // Mocking finding the entity ID
    const entityId = change.source.toLowerCase().replace(/\s+/g, '-');
    
    // EntityType is generic string, we pass it to GraphService
    const type = change.entityType || "UNKNOWN";

    const subgraph = await EntityGraphService.getSubgraph(type, entityId, 2);
    
    // Summarize the impact for the tradeoff engine
    const nodes = subgraph.nodes;
    
    // In a real system we might group by type
    return {
      totalNodes: nodes.length,
      nodes,
      relationships: subgraph.relationships
    };
  }
}
