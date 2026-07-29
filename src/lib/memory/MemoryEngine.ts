import { DecisionDetector } from "./DecisionDetector";
import { DecisionGenerator } from "./DecisionGenerator";
import { MemoryStore } from "./MemoryStore";
import { IntelligenceEventBus } from "../intelligence/events/EventBus";
import { GraphService } from "../intelligence/graph/GraphService";
import { IntelligenceFacade } from "../intelligence/IntelligenceFacade";
import { db } from "../db";
import { MemoryStatus } from "@prisma/client";

export class MemoryEngine {
  /**
   * Main entrypoint for the Decision Intelligence Layer.
   * Called asynchronously when a new artifact version is persisted.
   */
  static async captureDecision(
    workflowId: string,
    artifactType: string,
    sourceVersionId: string,
    oldContent: string | null,
    newContent: string
  ) {
    try {
      console.log(`[MemoryEngine] Analyzing change for ${artifactType}`);
      IntelligenceFacade.initialize();
      
      // 1. Detect if change is significant
      const detection = DecisionDetector.detect(artifactType, oldContent, newContent);
      if (!detection.isSignificant) {
        console.log(`[MemoryEngine] Change was not significant, skipping.`);
        return;
      }

      // 2. Generate Decision Trace
      const trace = await DecisionGenerator.generate(
        artifactType,
        oldContent,
        newContent,
        detection
      );

      // Determine initial status based on Workflow approvalPolicy
      const workflow = await db.workflow.findUnique({ where: { id: workflowId } });
      let status: MemoryStatus = "ACTIVE";
      
      if (workflow) {
        if (workflow.approvalPolicy === "ALL") {
          status = "PENDING_REVIEW";
        } else if (workflow.approvalPolicy === "HIGH_AND_CRITICAL") {
          if (detection.severity === "HIGH" || detection.severity === "CRITICAL") {
            status = "PENDING_REVIEW";
          }
        }
      }

      // 3. Persist or Consolidate Memory
      const memory = await MemoryStore.saveDecision(
        workflowId,
        sourceVersionId,
        detection.memoryType || "REQUIREMENT_CHANGE",
        detection.severity || "MEDIUM",
        status,
        trace,
        oldContent,
        newContent
      );

      console.log(`[MemoryEngine] Captured Decision: ${memory.id} (${trace.title}) with status ${status}`);

      // 4. Trigger Drift Engine for downstream nodes only if ACTIVE
      if (status === "ACTIVE") {
        const node = await GraphService.getNode(memory.id);
        if (node) {
          IntelligenceEventBus.emit("NODE_UPDATED", {
            workflowId,
            timestamp: new Date(),
            node
          });
        }
      }
    } catch (error) {
      console.error("[MemoryEngine] Failed to capture decision:", error);
    }
  }
}
