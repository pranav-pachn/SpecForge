import { GraphNode, GraphEdge, NodeType, EdgeType } from "./NodeTypes";
import { GraphStore } from "./GraphStore";

export interface GraphQueryOptions {
  workflowId: string;
  type?: NodeType;
  status?: string;
  relatedTo?: string; // Node ID
  relationType?: EdgeType;
}

/**
 * High-level internal API to search the graph.
 */
export class GraphQuery {
  
  static async findNodes(options: GraphQueryOptions): Promise<GraphNode[]> {
    const nodes = await GraphStore.getWorkflowNodes(options.workflowId);
    let filtered = nodes;

    if (options.type) {
      filtered = filtered.filter(n => n.type === options.type);
    }
    
    if (options.status) {
      filtered = filtered.filter(n => n.status === options.status);
    }

    if (options.relatedTo) {
      const edges = await GraphStore.getWorkflowEdges(options.workflowId);
      
      const relatedIds = new Set<string>();
      edges.forEach(e => {
        if (options.relationType && e.type !== options.relationType) return;
        
        if (e.sourceId === options.relatedTo) relatedIds.add(e.targetId);
        if (e.targetId === options.relatedTo) relatedIds.add(e.sourceId);
      });

      filtered = filtered.filter(n => relatedIds.has(n.id));
    }

    return filtered;
  }
}
