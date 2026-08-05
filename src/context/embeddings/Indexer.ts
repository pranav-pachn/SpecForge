import { KnowledgeNode, KnowledgeRelationship } from "../knowledge/Node";
import { VectorRepository } from "../knowledge/database/VectorRepository";
import { EmbeddingProvider } from "./EmbeddingProvider";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class Indexer {
  /**
   * Converts an Artifact version's content into Knowledge Nodes and embeds them.
   * This handles the raw logic of chunking -> embedding -> storing.
   */
  static async indexArtifact(workflowId: string, artifactType: string, artifactId: string, version: number, content: string): Promise<void> {
    const nodes = this.chunkArtifact(workflowId, artifactType, artifactId, version, content);
    if (nodes.length === 0) return;

    // Delete existing stable nodes for this specific artifact version (idempotency)
    await prisma.knowledgeNode.deleteMany({
      where: {
        artifactId,
        version
      }
    });

    // Embed all contents in batch
    const texts = nodes.map(n => n.content);
    const embeddings = await EmbeddingProvider.embedBatch(texts);

    for (let i = 0; i < nodes.length; i++) {
      nodes[i].embedding = embeddings[i];
    }

    // Determine relationships (e.g., tasks relate to requirements)
    // For MVP, we simply store the nodes. We can expand graph edges here based on metadata.
    const relationships: KnowledgeRelationship[] = [];

    await VectorRepository.store(nodes, relationships);
  }

  /**
   * Domain-specific logic to split artifact JSON into text chunks (Nodes).
   */
  private static chunkArtifact(workflowId: string, artifactType: string, artifactId: string, version: number, content: string): Omit<KnowledgeNode, 'id' | 'createdAt'>[] {
    try {
      const data = JSON.parse(content);
      const nodes: Omit<KnowledgeNode, 'id' | 'createdAt'>[] = [];
      const baseNode = { workflowId, artifactId, version, status: "APPROVED" };

      if (artifactType === "SPEC") {
        if (data.requirements) {
          for (const req of data.requirements) {
            nodes.push({
              ...baseNode,
              type: "requirement",
              title: `REQ: ${req.title}`,
              content: `Requirement: ${req.title}\nDescription: ${req.description}\nAcceptance Criteria: ${req.acceptanceCriteria?.join(', ')}`,
              importanceScore: 0.9,
              metadata: { originalId: req.id }
            });
          }
        }
      } else if (artifactType === "ARCHITECTURE") {
        if (data.modules) {
          for (const mod of data.modules) {
            nodes.push({
              ...baseNode,
              type: "architecture",
              title: `Module: ${mod.name}`,
              content: `Architecture Module: ${mod.name}\nResponsibilities: ${mod.responsibilities}\nDependencies: ${mod.dependencies?.join(', ')}`,
              importanceScore: 0.9,
              metadata: { name: mod.name }
            });
          }
        }
        if (data.apis) {
          for (const api of data.apis) {
            nodes.push({
              ...baseNode,
              type: "api",
              title: `API: ${api.method} ${api.path}`,
              content: `API Endpoint: ${api.method} ${api.path}\nRequest: ${JSON.stringify(api.request)}\nResponse: ${JSON.stringify(api.response)}`,
              importanceScore: 0.8,
              metadata: { path: api.path }
            });
          }
        }
      } else if (artifactType === "PLAN") {
        if (data.features) {
          for (const feat of data.features) {
            nodes.push({
              ...baseNode,
              type: "planning",
              title: `Feature: ${feat.name}`,
              content: `Planned Feature: ${feat.name}\nDescription: ${feat.description}\nReason: ${feat.traceability?.reason}`,
              importanceScore: 0.7,
              metadata: { name: feat.name }
            });
          }
        }
      } else if (artifactType === "TASK_BREAKDOWN") {
        if (Array.isArray(data)) {
          for (const task of data) {
            nodes.push({
              ...baseNode,
              type: "task",
              title: `Task: ${task.title}`,
              content: `Task: ${task.title}\nDescription: ${task.description}\nComplexity: ${task.complexity}`,
              importanceScore: 0.6,
              metadata: { order: task.order }
            });
          }
        }
      }

      return nodes;
    } catch (e) {
      console.warn("[Indexer] Failed to parse artifact content for chunking", e);
      return [];
    }
  }
}
