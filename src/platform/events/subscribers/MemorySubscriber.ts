import { DomainEvent } from '../DomainEvent';
import { DomainEventType } from '../DomainEventType';
import { EventSubscriber } from '../dispatcher/EventSubscriber';
import { MemoryEngine } from '@/intelligence/memory/MemoryEngine';

export class MemorySubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["SpecificationCreated", "ArchitectureGenerated", "TasksGenerated"];
  priority: number = 100; // Early processing

  async handle(event: DomainEvent): Promise<void> {
    if (!event.workflowId) return;

    // Use runtime type checking or switch
    if (event.type === "SpecificationCreated") {
      const payload = event.payload as any;
      await MemoryEngine.captureDecision(
        event.workflowId,
        "SPEC",
        payload.versionId,
        null, // For Phase 2A MVP, assuming new creation
        payload.content
      ).catch(e => console.error("[MemorySubscriber] Async capture failed:", e));
    }
    
    if (event.type === "ArchitectureGenerated") {
      const payload = event.payload as any;
      await MemoryEngine.captureDecision(
        event.workflowId,
        "ARCHITECTURE",
        payload.versionId,
        null,
        payload.content
      ).catch(e => console.error("[MemorySubscriber] Async capture failed:", e));
    }
    
    if (event.type === "TasksGenerated") {
      const payload = event.payload as any;
      await MemoryEngine.captureDecision(
        event.workflowId,
        "TASK_BREAKDOWN",
        payload.versionId,
        null,
        payload.content
      ).catch(e => console.error("[MemorySubscriber] Async capture failed:", e));
    }
  }
}
