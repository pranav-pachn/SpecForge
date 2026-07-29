import { GraphService } from "../graph/GraphService";
import { GraphNode, NodeType } from "../graph/NodeTypes";

export interface ImpactCategory {
  count: number;
  maxScore: number;
  label: string;
}

export interface ImpactReport {
  sourceNodeId: string;
  overall: number;
  categories: Record<string, ImpactCategory>;
  affectedNodes: {
    node: GraphNode;
    score: number;
    depth: number;
  }[];
}

const TYPE_MULTIPLIERS: Partial<Record<NodeType, number>> = {
  [NodeType.ARCHITECTURE]: 1.0,
  [NodeType.TASK]: 0.8,
  [NodeType.FILE]: 0.6,
  [NodeType.TEST]: 0.5,
  [NodeType.REVIEW]: 0.4,
  [NodeType.VALIDATION]: 0.3,
  [NodeType.DEPLOYMENT]: 0.9,
  [NodeType.PR]: 0.7,
};

export class ImpactPredictor {
  /**
   * Predicts the downstream impact of changing a specific node.
   */
  static async predict(workflowId: string, sourceNodeId: string): Promise<ImpactReport> {
    const maxDepth = 5;
    const baseScore = 100;
    const decayFactor = 0.7; // Score decays by 30% each step down the graph

    // Traverse outward from the source node
    const downstreamNodes = await GraphService.getDownstreamImpact(workflowId, sourceNodeId, maxDepth);
    
    // We actually need depths to calculate scores accurately, but our current Traversal returns a flat list.
    // Let's approximate depth based on a new traversal or just use a default depth of 1 for now, 
    // but ideally we modify getDownstreamImpact to return depths. For this sprint, we'll implement a local BFS with depth.
    
    // Doing a local BFS to get accurate depths
    const { nodes, edges } = await this.fetchLocalGraph(workflowId);
    
    const affected = this.bfsWithDepth(nodes, edges, sourceNodeId, maxDepth);
    
    const report: ImpactReport = {
      sourceNodeId,
      overall: 0,
      categories: {},
      affectedNodes: []
    };

    let totalScore = 0;

    for (const item of affected) {
      const typeMultiplier = TYPE_MULTIPLIERS[item.node.type] || 0.5;
      const score = Math.round(baseScore * Math.pow(decayFactor, item.depth - 1) * typeMultiplier);
      
      report.affectedNodes.push({
        node: item.node,
        score,
        depth: item.depth
      });

      totalScore += score;

      const typeStr = item.node.type as string;
      if (!report.categories[typeStr]) {
        report.categories[typeStr] = {
          count: 0,
          maxScore: 0,
          label: this.formatLabel(typeStr)
        };
      }
      
      report.categories[typeStr].count += 1;
      if (score > report.categories[typeStr].maxScore) {
        report.categories[typeStr].maxScore = score;
      }
    }

    report.overall = affected.length > 0 ? Math.min(Math.round(totalScore / affected.length), 100) : 0;
    
    return report;
  }

  private static formatLabel(type: string) {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() + "s";
  }

  private static async fetchLocalGraph(workflowId: string) {
    const nodes = await GraphService.getWorkflowNodes(workflowId);
    const edges = await GraphService.getWorkflowEdges(workflowId);
    return { nodes, edges };
  }

  private static bfsWithDepth(nodes: GraphNode[], edges: any[], startId: string, maxDepth: number) {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const visited = new Set<string>();
    const result: { node: GraphNode; depth: number }[] = [];
    
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.depth > 0) {
        const n = nodeMap.get(current.id);
        if (n) result.push({ node: n, depth: current.depth });
      }
      
      if (current.depth >= maxDepth) continue;
      
      const adjacentEdges = edges.filter(e => e.sourceId === current.id);
      for (const edge of adjacentEdges) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push({ id: edge.targetId, depth: current.depth + 1 });
        }
      }
    }
    
    return result;
  }
}
