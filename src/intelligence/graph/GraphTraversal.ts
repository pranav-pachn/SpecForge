import { GraphNode, GraphEdge, EdgeType } from "./NodeTypes";
import { GraphStore } from "./GraphStore";

export interface TraversalOptions {
  maxDepth?: number;
  edgeTypes?: EdgeType[];
  direction?: "in" | "out" | "both";
}

export interface Path {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphTraversal {
  
  /**
   * Breadth-First Search traversal
   */
  static async traverse(workflowId: string, startNodeId: string, options: TraversalOptions = {}): Promise<GraphNode[]> {
    const nodes = await GraphStore.getWorkflowNodes(workflowId);
    const edges = await GraphStore.getWorkflowEdges(workflowId);
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const maxDepth = options.maxDepth ?? 5;
    const direction = options.direction ?? "both";
    
    const visited = new Set<string>();
    const result: GraphNode[] = [];
    
    const queue: { id: string; depth: number }[] = [{ id: startNodeId, depth: 0 }];
    visited.add(startNodeId);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = nodeMap.get(current.id);
      
      if (node && current.depth > 0) {
        result.push(node);
      }
      
      if (current.depth >= maxDepth) continue;
      
      const adjacentEdges = edges.filter(e => {
        if (options.edgeTypes && options.edgeTypes.length > 0 && !options.edgeTypes.includes(e.type)) return false;
        
        if (direction === "out") return e.sourceId === current.id;
        if (direction === "in") return e.targetId === current.id;
        return e.sourceId === current.id || e.targetId === current.id;
      });
      
      for (const edge of adjacentEdges) {
        const nextId = edge.sourceId === current.id ? edge.targetId : edge.sourceId;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, depth: current.depth + 1 });
        }
      }
    }
    
    return result;
  }

  /**
   * Shortest path using BFS
   */
  static async shortestPath(workflowId: string, fromId: string, toId: string): Promise<Path | null> {
    const nodes = await GraphStore.getWorkflowNodes(workflowId);
    const edges = await GraphStore.getWorkflowEdges(workflowId);
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgeMap = new Map<string, GraphEdge>(); // key: source->target
    edges.forEach(e => edgeMap.set(`${e.sourceId}->${e.targetId}`, e));

    const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
    const visited = new Set<string>();
    visited.add(fromId);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      
      if (id === toId) {
        const resultNodes = path.map(p => nodeMap.get(p)!).filter(Boolean);
        const resultEdges: GraphEdge[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const e1 = edgeMap.get(`${path[i]}->${path[i+1]}`);
          const e2 = edgeMap.get(`${path[i+1]}->${path[i]}`); // Undirected traversal fallback
          if (e1) resultEdges.push(e1);
          else if (e2) resultEdges.push(e2);
        }
        return { nodes: resultNodes, edges: resultEdges };
      }
      
      const adjacentEdges = edges.filter(e => e.sourceId === id || e.targetId === id);
      for (const edge of adjacentEdges) {
        const nextId = edge.sourceId === id ? edge.targetId : edge.sourceId;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }
    
    return null;
  }

  /**
   * Detects cycles involving the given node
   */
  static async detectCycles(workflowId: string, startNodeId: string): Promise<boolean> {
    const edges = await GraphStore.getWorkflowEdges(workflowId);
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    // Convert to adjacency list (directed)
    const adjList = new Map<string, string[]>();
    edges.forEach(e => {
      if (!adjList.has(e.sourceId)) adjList.set(e.sourceId, []);
      adjList.get(e.sourceId)!.push(e.targetId);
    });

    const isCyclicUtil = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);

        const neighbors = adjList.get(node) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && isCyclicUtil(neighbor)) {
            return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }
      }
      recStack.delete(node);
      return false;
    };

    return isCyclicUtil(startNodeId);
  }
}
