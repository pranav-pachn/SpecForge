import { RepairPlan, RepairResult } from "./interfaces";
import { aiGateway } from "../ai/AIGateway";
import { RepairPromptBuilder } from "./RepairPromptBuilder";
import { ArtifactAdapter } from "./adapters/ArtifactAdapter";
import { PlatformEventBus } from "../events/PlatformEventBus";
import { Tracer, SpanKind, SnapshotType } from "../telemetry/Tracer";

export class RepairExecutor {
  constructor(private adapter: ArtifactAdapter) {}

  async execute(
    plan: RepairPlan,
    originalArtifact: string,
    agentId: string,
    workflowId: string,
    traceId?: string,
    parentSpanId?: string
  ): Promise<RepairResult> {
    
    // We will track total duration ourselves, though Tracer also tracks span duration
    const startTime = Date.now();
    let currentArtifact = originalArtifact;
    const repairedSections: string[] = [];

    // Break execution into sections
    const sections = this.adapter.split(currentArtifact);

    for (const targetSectionId of plan.targetSections) {
      const targetSection = sections.find(s => s.id === targetSectionId);
      
      if (!targetSection) {
        console.warn(`[RepairExecutor] Section ${targetSectionId} not found. Skipping.`);
        continue;
      }

      // Build Prompt
      const repairPrompt = RepairPromptBuilder.build(plan, targetSection.content);

      // Execute via Gateway (wrapped in a Tracer span for Observability)
      try {
        const repairedContent = await this.invokeGateway(repairPrompt, workflowId, traceId, parentSpanId);
        
        // Patch Artifact
        currentArtifact = this.adapter.patch(currentArtifact, targetSectionId, repairedContent);
        repairedSections.push(targetSectionId);

        // Emit rich observability event
        PlatformEventBus.emit("REPAIR_SECTION_COMPLETED" as any, {
          timestamp: new Date(),
          entityType: "REPAIR",
          entityId: targetSectionId,
          workflowId,
          metadata: { strategy: plan.strategy }
        });

      } catch (error) {
        console.error(`[RepairExecutor] Failed to repair section ${targetSectionId}`, error);
        PlatformEventBus.emit("REPAIR_FAILED" as any, {
          timestamp: new Date(),
          entityType: "REPAIR",
          entityId: targetSectionId,
          workflowId,
          metadata: { error: String(error) }
        });
        // We could throw here, but let's try to repair other sections if multiple were planned
      }
    }

    const durationMs = Date.now() - startTime;

    PlatformEventBus.emit("REPAIR_COMPLETED" as any, {
      timestamp: new Date(),
      entityType: "REPAIR",
      entityId: agentId,
      workflowId,
      metadata: { durationMs, repairedSections }
    });

    return {
      artifact: currentArtifact,
      repairedSections,
      attempts: 1, // Will be incremented by the Gate loop
      durationMs,
      confidence: plan.confidence
    };
  }

  private async invokeGateway(prompt: string, workflowId: string, traceId?: string, parentSpanId?: string): Promise<string> {
    const aiRequest = {
      prompt,
      capability: "SPECIFICATION" as any, // We would derive this from agentId normally
      traceId,
      parentSpanId
    };

    if (traceId) {
      return await Tracer.withSpan({
        name: 'RepairExecution',
        kind: SpanKind.AGENT,
        traceId,
        parentSpanId,
        workflowId
      }, async (span) => {
        aiRequest.parentSpanId = span.id; // Pass down
        
        // Snapshot the repair prompt for observability
        await span.addSnapshot(SnapshotType.PROMPT, {
          role: "user",
          content: prompt
        }).catch(() => {});
        
        const response = await aiGateway.generate(aiRequest);
        return response.text!;
      });
    }

    const response = await aiGateway.generate(aiRequest);
    return response.text!;
  }
}
