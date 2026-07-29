import { db } from "../db";
import { ImpactAnalyzer } from "./ImpactAnalyzer";
import { DriftEntityType } from "@prisma/client";

export class DriftEngine {
  /**
   * Evaluates the impact analysis and creates DriftEvents for high-impact nodes.
   */
  static async evaluateImpact(workflowId: string, memoryId: string, sourceVersionId: string | null) {
    if (!sourceVersionId) return;

    try {
      const memory = await db.engineeringMemory.findUnique({ where: { id: memoryId } });
      if (!memory) return;

      const impact = await ImpactAnalyzer.analyze(memoryId, memory.severity);
      
      // Threshold for drift: Impact Score >= 50
      const driftThreshold = 50;
      const staleNodes = impact.affectedNodes.filter(node => node.score >= driftThreshold);

      for (const node of staleNodes) {
        // Map node types to DriftEntityType
        let entityType: DriftEntityType | null = null;
        if (node.type === "TASK") entityType = "TASK";
        else if (node.type === "ARTIFACT_VERSION" && node.title.includes("PLAN")) entityType = "PLAN";
        else if (node.type === "REVIEW") entityType = "REVIEW";
        else if (node.type === "VALIDATION") entityType = "VALIDATION";
        else if (node.type === "PACK") entityType = "PACK";

        if (entityType) {
          let targetVersionId = sourceVersionId;
          if (entityType === "TASK") {
            const task = await db.task.findUnique({ where: { id: node.id } });
            if (task) targetVersionId = task.versionId;
          } else if (entityType === "PACK") {
            const pack = await db.executionPack.findUnique({ where: { id: node.id } });
            if (pack) targetVersionId = pack.versionId;
          } else if (node.type === "ARTIFACT_VERSION") {
            targetVersionId = node.id;
          }

          // Check if unresolved event already exists for this node to avoid duplicates
          const existing = await db.driftEvent.findFirst({
            where: {
              version: { artifact: { workflowId } },
              entityId: node.id,
              entityType,
              status: "OPEN"
            }
          });

          if (!existing) {
            await db.driftEvent.create({
              data: {
                versionId: targetVersionId,
                sourceVersionId,
                entityType,
                entityId: node.id,
                description: `Impact score: ${node.score}. Affected by decision: ${memory.title}`,
                status: "OPEN"
              }
            });
            console.log(`[DriftEngine] Flagged ${entityType} ${node.id} as STALE due to ${memory.decisionId}`);
          }
        }
      }
    } catch (e) {
      console.error("[DriftEngine] Failed to evaluate impact", e);
    }
  }
}
