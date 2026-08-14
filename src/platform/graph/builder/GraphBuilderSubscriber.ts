import { DomainEvent } from "@/platform/events/DomainEvent";
import { DomainEventType } from "@/platform/events/DomainEventType";
import { EventSubscriber } from "@/platform/events/dispatcher/EventSubscriber";
import { GraphProjection } from "./GraphProjection";
import { GraphRepository } from "../GraphRepository";

export class GraphBuilderSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = [
    "SpecificationCreated",
    "ArchitectureGenerated",
    "TasksGenerated",
    "DecisionCreated",
    "ExecutionPackGenerated"
  ];
  
  priority: number = 80;

  async handle(event: DomainEvent): Promise<void> {
    console.log(`[GraphBuilderSubscriber] GraphNode models removed. Skipping graph build.`);
  }
}

async function dbFindNode(externalId: string) {
  return null;
}
