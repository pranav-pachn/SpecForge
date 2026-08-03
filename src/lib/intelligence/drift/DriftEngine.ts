import { db } from "@/lib/db";
import { PlatformEventBus } from "@/enterprise/events/PlatformEventBus";
import { ImpactPredictor } from "../impact/ImpactPredictor";
import { GraphNode } from "../graph/NodeTypes";
import { DriftEventStatus } from "@prisma/client";

export class DriftEngine {
  
  /**
   * Initializes the Drift Engine to listen for graph changes.
   */
  static initialize() {
    PlatformEventBus.subscribe("NODE_UPDATED", async (payload) => {
      if (payload.node) {
        if (!payload.workflowId) throw new Error("Missing workflowId");
        await this.handleNodeUpdate(payload.workflowId, payload.node);
      }
    });
  }

  /**
   * When a node updates (e.g., Requirement changed), predict impact and flag downstream nodes as drifted.
   */
  private static async handleNodeUpdate(workflowId: string, node: GraphNode) {
    const impactReport = await ImpactPredictor.predict(workflowId, node.id);

    for (const affected of impactReport.affectedNodes) {
      // Find the artifact version ID associated with this workflow to attach the drift event to.
      // In a robust implementation, we map `affected.node.id` back to its specific entity.
      
      const artifact = await db.artifact.findFirst({
        where: { workflowId },
        include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
      });
      
      if (!artifact || artifact.versions.length === 0) continue;
      
      const latestVersionId = artifact.versions[0].id;

      // Ensure drift event doesn't already exist and open for this entity
      const existing = await db.driftEvent.findFirst({
        where: {
          versionId: latestVersionId,
          entityId: affected.node.id,
          status: { in: [DriftEventStatus.OPEN, DriftEventStatus.ACKNOWLEDGED] }
        }
      });

      if (!existing) {
        await db.driftEvent.create({
          data: {
            versionId: latestVersionId,
            entityType: this.mapNodeTypeToDriftType(affected.node.type),
            entityId: affected.node.id,
            description: `Affected by changes in ${node.type} ${node.title.substring(0, 20)}...`,
            status: DriftEventStatus.OPEN,
          }
        });
        
        await PlatformEventBus.emit("DRIFT_DETECTED", {
          workflowId,
          entityType: "DRIFT_ANALYSIS",
          timestamp: new Date(),
          metadata: { affectedNodeId: affected.node.id }
        });
      }
    }
  }

  private static mapNodeTypeToDriftType(nodeType: string): any {
    // Map to Prisma enum DriftEntityType
    const validTypes = ["TASK", "PACK", "REVIEW", "VALIDATION", "PLAN"];
    if (validTypes.includes(nodeType)) return nodeType;
    return "TASK"; // Fallback for MVP if enum doesn't match
  }
}
