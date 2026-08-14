import { DomainEvent } from "@/platform/events/DomainEvent";
import { DomainEventType } from "@/platform/events/DomainEventType";
import { EventSubscriber } from "@/platform/events/dispatcher/EventSubscriber";
import { EngineeringMemory } from "../EngineeringMemory";

export class DecisionSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["SpecificationCreated", "ArchitectureGenerated", "TasksGenerated"];
  priority: number = 100;

  async handle(event: DomainEvent): Promise<void> {
    if (!event.workflowId) return;

    try {
      if (event.type === "SpecificationCreated") {
        const payload = event.payload as any;
        await EngineeringMemory.captureDecision(
          event.workflowId,
          "SPEC",
          payload.versionId,
          null,
          payload.content
        );
      }
      
      if (event.type === "ArchitectureGenerated") {
        const payload = event.payload as any;
        await EngineeringMemory.captureDecision(
          event.workflowId,
          "ARCHITECTURE",
          payload.versionId,
          null,
          payload.content
        );
      }
      
      if (event.type === "TasksGenerated") {
        const payload = event.payload as any;
        await EngineeringMemory.captureDecision(
          event.workflowId,
          "TASK_BREAKDOWN",
          payload.versionId,
          null,
          payload.content
        );
      }
    } catch (e) {
      console.error(`[DecisionSubscriber] Async capture failed for ${event.type}:`, e);
    }
  }
}
