import { GraphStore } from "./GraphStore";
import { GraphQuery, GraphQueryOptions } from "./GraphQuery";
import { GraphTraversal, TraversalOptions } from "./GraphTraversal";
import { GraphNode, GraphEdge } from "./NodeTypes";

/**
 * The Business Logic layer for the Engineering Graph.
 * Exposes graph capabilities to the rest of the Engineering Intelligence Facade.
 */
export class GraphService {

  static async getNode(id: string): Promise<GraphNode | null> {
    return GraphStore.getNode(id);
  }

  static async getWorkflowNodes(workflowId: string): Promise<GraphNode[]> {
    return GraphStore.getWorkflowNodes(workflowId);
  }

  static async getWorkflowEdges(workflowId: string): Promise<GraphEdge[]> {
    return GraphStore.getWorkflowEdges(workflowId);
  }

  static async findNodes(options: GraphQueryOptions): Promise<GraphNode[]> {
    return GraphQuery.findNodes(options);
  }

  static async getDownstreamImpact(workflowId: string, nodeId: string, maxDepth: number = 3): Promise<GraphNode[]> {
    return GraphTraversal.traverse(workflowId, nodeId, { maxDepth, direction: "out" });
  }

  static async getUpstreamDependencies(workflowId: string, nodeId: string, maxDepth: number = 3): Promise<GraphNode[]> {
    return GraphTraversal.traverse(workflowId, nodeId, { maxDepth, direction: "in" });
  }

  static async getCriticalPath(workflowId: string, fromId: string, toId: string) {
    return GraphTraversal.shortestPath(workflowId, fromId, toId);
  }

  static async checkCycles(workflowId: string, nodeId: string): Promise<boolean> {
    return GraphTraversal.detectCycles(workflowId, nodeId);
  }
}
