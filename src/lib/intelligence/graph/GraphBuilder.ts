import { db } from "@/lib/db";
import { IntelligenceEventBus } from "../events/EventBus";
import { NodeType, EdgeType, NodeStatus } from "./NodeTypes";

export class GraphBuilder {
  
  /**
   * Translates structured artifact JSON directly into graph entities.
   * Does NOT parse markdown. Expects clean objects from Agents.
   */
  static async buildFromArtifact(workflowId: string, artifactType: string, artifactId: string, version: number, data: any) {
    if (artifactType === "SPEC") {
      await this.buildSpecGraph(workflowId, artifactId, version, data);
    } else if (artifactType === "ARCHITECTURE") {
      await this.buildArchitectureGraph(workflowId, artifactId, version, data);
    } else if (artifactType === "TASK_BREAKDOWN") {
      await this.buildTaskGraph(workflowId, artifactId, version, data);
    }
  }

  private static async buildSpecGraph(workflowId: string, artifactId: string, version: number, data: any) {
    if (!data.sections) return;
    
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i];
      // Store in existing repository (e.g., KnowledgeNode)
      const knode = await db.knowledgeNode.create({
        data: {
          workflowId,
          type: "requirement", // lowercased for existing schema compatibility
          artifactId,
          version,
          status: "APPROVED",
          title: `REQ: ${section.title}`,
          content: `Requirement: ${section.title}\nDescription: ${section.content}`,
          importanceScore: 0.9,
          metadata: { originalId: `req-${i}`, traceability: section.traceability }
        }
      });
      
      IntelligenceEventBus.emit("NODE_CREATED", {
        workflowId,
        timestamp: new Date(),
        node: {
          id: knode.id,
          workflowId,
          type: NodeType.REQUIREMENT,
          title: knode.title,
          status: NodeStatus.ACTIVE,
          metadata: {},
          createdAt: knode.createdAt
        }
      });
    }
  }

  private static async buildArchitectureGraph(workflowId: string, artifactId: string, version: number, data: any) {
    // 1. Create Architecture Modules
    if (data.modules) {
      for (const mod of data.modules) {
        const knode = await db.knowledgeNode.create({
          data: {
            workflowId, type: "architecture", artifactId, version, status: "APPROVED",
            title: `Module: ${mod.name}`, content: `Module: ${mod.name}`, importanceScore: 0.9,
            metadata: { name: mod.name }
          }
        });
        
        // Example Edge: Module DERIVED_FROM Requirement
        // If the structured data had requirements listed:
        if (mod.implements_requirements) {
          for (const reqId of mod.implements_requirements) {
            // Find the Requirement node to link
            const reqNodes = await db.knowledgeNode.findMany({ where: { workflowId, type: "requirement" }});
            const match = reqNodes.find(r => (r.metadata as any)?.originalId === reqId);
            if (match) {
              await db.knowledgeRelationship.create({
                data: {
                  sourceNodeId: knode.id,
                  targetNodeId: match.id,
                  relationType: "derived_from"
                }
              });
              IntelligenceEventBus.emit("EDGE_CREATED", { workflowId, timestamp: new Date() });
            }
          }
        }
      }
    }
  }

  private static async buildTaskGraph(workflowId: string, artifactId: string, version: number, data: any) {
    // Usually tasks are already created by the TaskPlannerAgent into `db.task`
    // but this builder could create explicit graph edges if not already present.
    // e.g. mapping tasks to requirements
  }
}
