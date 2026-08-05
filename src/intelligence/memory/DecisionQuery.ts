import { db } from "@/platform/storage/db";
import { GraphService } from "../graph/GraphService";
import { NodeType } from "../graph/NodeTypes";

export class DecisionQuery {
  
  /**
   * Search for decisions related to a specific node (e.g. Requirement or Task)
   * It uses the Engineering Graph to find relationships.
   */
  static async findDecisionsForNode(workflowId: string, nodeId: string) {
    // In the future this uses graph traversal to find connected Memory Nodes.
    // For now we mock it with direct relationships from the DB.
    
    const relations = await db.memoryRelationship.findMany({
      where: {
        targetId: nodeId,
        sourceType: "MEMORY"
      }
    });

    if (relations.length === 0) return [];

    const memoryIds = relations.map(r => r.sourceId);

    return db.engineeringMemory.findMany({
      where: {
        id: { in: memoryIds },
        workflowId
      },
      include: {
        revisions: {
          orderBy: { revision: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a consolidated timeline of all decisions for a workflow.
   */
  static async getConsolidatedTimeline(workflowId: string, typeFilter?: string) {
    const whereClause: any = { workflowId };
    if (typeFilter && typeFilter !== "ALL") {
      whereClause.memoryType = typeFilter;
    }

    return db.engineeringMemory.findMany({
      where: whereClause,
      include: {
        revisions: {
          orderBy: { revision: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
