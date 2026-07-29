import { PrismaClient } from "@prisma/client";
import { KnowledgeNode, RetrievedNode } from "./Node";

const prisma = new PrismaClient();

export class Relationships {
  /**
   * Expands the context by finding related nodes for a given set of nodes.
   * Useful for two-step retrieval (Vector Search -> Expand Graph).
   */
  static async expand(nodes: RetrievedNode[], maxDepth: number = 1): Promise<RetrievedNode[]> {
    if (nodes.length === 0 || maxDepth === 0) return nodes;

    const nodeIds = nodes.map(n => n.id);
    const expandedIds = new Set(nodeIds);
    const resultNodes = [...nodes];

    // Find all relationships where the current nodes are either source or target
    const relations = await prisma.knowledgeRelationship.findMany({
      where: {
        OR: [
          { sourceNodeId: { in: nodeIds } },
          { targetNodeId: { in: nodeIds } }
        ]
      }
    });

    // Gather all new node IDs to fetch
    const relatedIdsToFetch = new Set<string>();
    for (const rel of relations) {
      if (!expandedIds.has(rel.sourceNodeId)) relatedIdsToFetch.add(rel.sourceNodeId);
      if (!expandedIds.has(rel.targetNodeId)) relatedIdsToFetch.add(rel.targetNodeId);
    }

    if (relatedIdsToFetch.size > 0) {
      const fetchedNodes = await prisma.knowledgeNode.findMany({
        where: { 
          id: { in: Array.from(relatedIdsToFetch) },
          status: 'APPROVED'
        }
      });

      for (const node of fetchedNodes) {
        resultNodes.push({
          ...node,
          // Assign a baseline similarity score since it was retrieved via relationship, not vector
          similarity: 0.8, 
          finalScore: 0
        });
        expandedIds.add(node.id);
      }
    }

    return resultNodes;
  }
}
