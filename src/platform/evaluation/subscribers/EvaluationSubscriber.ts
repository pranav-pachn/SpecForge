import { EventSubscriber } from "../../events/dispatcher/EventSubscriber";
import { DomainEvent } from "../../events/DomainEvent";
import { DomainEventType } from "../../events/DomainEventType";
import { evaluationEngine } from "../EvaluationEngine";
import { evaluationBundleBuilder } from "../context/EvaluationBundleBuilder";
import { PlatformEventBus } from "../../events/PlatformEventBus";
import { Capability } from "../../ai/interfaces/Capability";
import { db } from "../../storage/db";

export class EvaluationSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["SpecificationCreated", "ArchitectureGenerated", "TasksGenerated"];
  priority = 50;

  async handle(event: DomainEvent): Promise<void> {
    console.log(`[EvaluationSubscriber] Evaluation models removed. Skipping evaluation.`);
  }
}
