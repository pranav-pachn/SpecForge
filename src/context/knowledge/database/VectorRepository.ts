import { PrismaClient } from "@prisma/client";
import { KnowledgeNode, KnowledgeRelationship, NodeWithRelations, RetrievedNode } from "../Node";

const prisma = new PrismaClient();

export class VectorRepository {
  /**
   * Performs a vector similarity search on the KnowledgeNode table using pgvector.
   */
  static async search(workflowId: string, queryEmbedding: number[], limit: number = 10, types?: string[]): Promise<RetrievedNode[]> {
    const embeddingStr = `[${queryEmbedding.join(',')}]`;
    
    // Using raw SQL for pgvector similarity search (<=> operator is cosine distance)
    let rows: any[];
    if (types && types.length > 0) {
      const typesList = types.map(t => `'${t}'`).join(',');
      rows = await prisma.$queryRawUnsafe(`
        SELECT id, "workflowId", type, "artifactId", version, status, title, content, 
               "importanceScore", metadata, "createdAt",
               1 - (embedding <=> $1::vector) as similarity
        FROM "KnowledgeNode"
        WHERE "workflowId" = $2 AND status = 'APPROVED' AND type IN (${typesList})
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, embeddingStr, workflowId, limit);
    } else {
      rows = await prisma.$queryRawUnsafe(`
        SELECT id, "workflowId", type, "artifactId", version, status, title, content, 
               "importanceScore", metadata, "createdAt",
               1 - (embedding <=> $1::vector) as similarity
        FROM "KnowledgeNode"
        WHERE "workflowId" = $2 AND status = 'APPROVED'
        ORDER BY embedding <=> $1::vector
        LIMIT $3
      `, embeddingStr, workflowId, limit);
    }

    return rows.map(row => ({
      ...row,
      finalScore: 0 // Will be computed by Ranking.ts
    })) as RetrievedNode[];
  }

  /**
   * Batch inserts nodes with embeddings and their relationships
   */
  static async store(nodes: Omit<KnowledgeNode, 'id' | 'createdAt'>[], relationships: Omit<KnowledgeRelationship, 'id'>[]): Promise<void> {
    // 1. Insert nodes and fetch their generated IDs
    const createdNodes = [];
    for (const node of nodes) {
      // First insert the basic data (without embedding) to get the ID
      const created = await prisma.knowledgeNode.create({
        data: {
          workflowId: node.workflowId,
          type: node.type,
          artifactId: node.artifactId,
          version: node.version,
          status: node.status,
          title: node.title,
          content: node.content,
          importanceScore: node.importanceScore,
          metadata: node.metadata || {},
        }
      });
      createdNodes.push(created);

      // Then update the embedding with raw SQL if provided
      if (node.embedding) {
        const embeddingStr = `[${node.embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "KnowledgeNode" SET embedding = $1::vector WHERE id = $2`,
          embeddingStr, created.id
        );
      }
    }

    // 2. Insert relationships
    if (relationships && relationships.length > 0) {
      for (const rel of relationships) {
        await prisma.knowledgeRelationship.create({
          data: {
            sourceNodeId: rel.sourceNodeId,
            targetNodeId: rel.targetNodeId,
            relationType: rel.relationType,
          }
        });
      }
    }
  }

  /**
   * Retrieves a node by ID with its relations
   */
  static async getNodeWithRelations(id: string): Promise<NodeWithRelations | null> {
    const node = await prisma.knowledgeNode.findUnique({
      where: { id },
      include: {
        sourceRelations: true,
        targetRelations: true,
      }
    });
    return node as unknown as NodeWithRelations | null;
  }
}
