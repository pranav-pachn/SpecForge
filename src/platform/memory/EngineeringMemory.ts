import { DecisionDetector } from "./detector/DecisionDetector";
import { DecisionExtractor } from "./extraction/DecisionExtractor";
import { DecisionRepository } from "./repository/DecisionRepository";
export type DecisionScope = "WORKFLOW" | "GLOBAL" | "PROJECT";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";

export class EngineeringMemory {
  /**
   * Captures a decision from a workflow artifact change.
   */
  static async captureDecision(
    workflowId: string,
    artifactType: string,
    sourceVersionId: string,
    oldContent: string | null,
    newContent: string
  ) {
    console.log(`[EngineeringMemory] Analyzing change for ${artifactType}`);
    
    // 1. Detect if change is significant
    const detection = DecisionDetector.detect(artifactType, oldContent, newContent);
    if (!detection.isSignificant) {
      console.log(`[EngineeringMemory] Change was not significant, skipping.`);
      return null;
    }

    // 2. Extract structured decision trace
    const extraction = await DecisionExtractor.extract(
      artifactType,
      oldContent,
      newContent,
      detection.deterministicDetails
    );

    // 3. Persist Decision
    // In Phase 6A, we simply create a new Decision.
    // In later phases, we'll implement 'findSimilar' to append to existing decisions instead of creating new ones.
    const decision = await DecisionRepository.createDecision(
      workflowId,
      sourceVersionId,
      "WORKFLOW" as DecisionScope,
      extraction
    );

    console.log(`[EngineeringMemory] Captured Decision: ${decision.decisionId} (${extraction.title})`);

    // 4. Emit event for downstream processors (like Graph, Outcome monitoring)
    PlatformEventBus.emit("DecisionCreated" as any, {
      timestamp: new Date(),
      entityType: "DECISION",
      entityId: decision.id,
      workflowId: decision.workflowId ?? undefined,
      metadata: { title: extraction.title }
    });

    return decision;
  }
}
