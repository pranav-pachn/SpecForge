import { PrismaClient } from "@prisma/client";
import { KnowledgeNode, RetrievedNode } from "./Node";
import { Retriever } from "../retrieval/Retriever";

const prisma = new PrismaClient();

export class KnowledgeService {
  /**
   * Universal search interface
   */
  static async search(workflowId: string, query: string, limit: number = 8): Promise<RetrievedNode[]> {
    return Retriever.search({ workflowId, query, limit });
  }

  /**
   * Retrieves overall stats for the workflow knowledge base
   */
  static async stats(workflowId: string): Promise<{ count: number; lastIndexed: Date | null }> {
    const count = await prisma.knowledgeNode.count({
      where: { workflowId, status: "APPROVED" }
    });

    const latest = await prisma.knowledgeNode.findFirst({
      where: { workflowId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });

    return {
      count,
      lastIndexed: latest?.createdAt || null
    };
  }

  /**
   * Deletes all knowledge for a workflow
   */
  static async delete(workflowId: string): Promise<void> {
    await prisma.knowledgeNode.deleteMany({
      where: { workflowId }
    });
  }
}
