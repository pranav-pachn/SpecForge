import { db } from "@/platform/storage/db";
import { GraphNode, GraphEdge, NodeType, EdgeType, NodeStatus } from "./NodeTypes";

export class GraphStore {
  
  /**
   * Universal fetch for a GraphNode by ID.
   * This facade inspects the ID prefix or searches multiple repositories if needed.
   */
  static async getNode(id: string): Promise<GraphNode | null> {
    // For MVP, we route based on a known prefix or query multiple tables.
    // E.g., if we use "TASK-xxx" vs "DEC-xxx". 
    // In a mature system, this delegates to specialized Repositories.
    
    // Example: Tasks
    const task = await db.task.findUnique({ where: { id } });
    if (task) {
      return {
        id: task.id,
        workflowId: task.workflowId,
        type: NodeType.TASK,
        title: task.title,
        status: task.status,
        metadata: { priority: task.priority, order: task.order },
        createdAt: task.createdAt
      };
    }

    // Example: Decisions (Memory)
    const memory = await db.engineeringMemory.findUnique({ where: { id } });
    if (memory) {
      return {
        id: memory.id,
        workflowId: memory.workflowId,
        type: NodeType.DECISION,
        title: memory.title,
        status: memory.status,
        metadata: { severity: memory.severity, type: memory.memoryType },
        createdAt: memory.createdAt
      };
    }
    
    // Fallback to KnowledgeNodes (which currently hold Requirements, Architecture, etc.)
    const kNode = await db.knowledgeNode.findUnique({ where: { id } });
    if (kNode) {
      const typeStr = kNode.type.toUpperCase() as keyof typeof NodeType;
      return {
        id: kNode.id,
        workflowId: kNode.workflowId,
        type: NodeType[typeStr] || NodeType.REQUIREMENT,
        title: kNode.title,
        status: kNode.status,
        metadata: kNode.metadata as any,
        createdAt: kNode.createdAt
      };
    }

    return null;
  }

  /**
   * Fetch all nodes for a workflow.
   */
  static async getWorkflowNodes(workflowId: string): Promise<GraphNode[]> {
    const nodes: GraphNode[] = [];
    
    const tasks = await db.task.findMany({ where: { workflowId } });
    tasks.forEach(t => nodes.push({
      id: t.id, workflowId: t.workflowId, type: NodeType.TASK, title: t.title,
      status: t.status, metadata: {}, createdAt: t.createdAt
    }));

    const memories = await db.engineeringMemory.findMany({ where: { workflowId } });
    memories.forEach(m => nodes.push({
      id: m.id, workflowId: m.workflowId, type: NodeType.DECISION, title: m.title,
      status: m.status, metadata: {}, createdAt: m.createdAt
    }));

    const kNodes = await db.knowledgeNode.findMany({ where: { workflowId } });
    kNodes.forEach(k => {
      const typeStr = k.type.toUpperCase() as keyof typeof NodeType;
      nodes.push({
        id: k.id, workflowId: k.workflowId, type: NodeType[typeStr] || NodeType.REQUIREMENT,
        title: k.title, status: k.status, metadata: k.metadata as any, createdAt: k.createdAt
      });
    });

    return nodes;
  }

  /**
   * Fetch edges for a workflow. 
   * Aggregates KnowledgeRelationship, MemoryRelationship, TaskDependency, etc.
   */
  static async getWorkflowEdges(workflowId: string): Promise<GraphEdge[]> {
    const edges: GraphEdge[] = [];
    
    // 1. Knowledge Relationships
    const kRels = await db.knowledgeRelationship.findMany({
      where: { sourceNode: { workflowId } }
    });
    kRels.forEach(r => edges.push({
      id: r.id, sourceId: r.sourceNodeId, targetId: r.targetNodeId,
      type: r.relationType.toUpperCase() as EdgeType || EdgeType.RELATES_TO,
      weight: 1.0, createdAt: new Date()
    }));

    // 2. Memory Relationships
    const mRels = await db.memoryRelationship.findMany(); 
    // Optimization: Filter by workflowId somehow, perhaps join on EngineeringMemory or Artifact
    // For MVP we just load them all and filter later or rely on the UI.
    mRels.forEach(r => edges.push({
      id: r.id, sourceId: r.sourceId, targetId: r.targetId,
      type: r.relationType.toUpperCase() as EdgeType || EdgeType.RELATES_TO,
      weight: 1.0, createdAt: r.createdAt
    }));
    
    // 3. Task Dependencies
    const tDeps = await db.taskDependency.findMany({
      where: { task: { workflowId } }
    });
    tDeps.forEach(d => edges.push({
      id: d.id, sourceId: d.taskId, targetId: d.dependsOnId,
      type: EdgeType.DEPENDS_ON, weight: 1.0, createdAt: new Date()
    }));

    return edges;
  }
}
