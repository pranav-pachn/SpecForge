import { EventSubscriber } from "../../events/dispatcher/EventSubscriber";
import { DomainEvent } from "../../events/DomainEvent";
import { DomainEventType } from "../../events/DomainEventType";
import { db } from "../../storage/db";
import { embeddingService } from "../rag/EmbeddingService";
import { vectorStore } from "../rag/VectorStore";
import { MarkdownChunker } from "../rag/Chunker";

export class IndexingSubscriber implements EventSubscriber {
  readonly id = "indexing-subscriber";
  readonly priority = 100; // Required by EventSubscriber interface
  private chunker = new MarkdownChunker(500); // 500 token chunks max

  // We listen to artifact creation/update events
  readonly eventTypes: DomainEventType[] = [
    "SpecificationCreated",
    "ReviewCompleted",
    "DriftDetected"
  ];

  async handle(event: DomainEvent): Promise<void> {
    try {
      if (event.type === "SpecificationCreated") {
        await this.indexArtifact(event);
      }
      // Add handlers for review and drift events as needed
    } catch (error) {
      console.error(`IndexingSubscriber failed for event ${event.id}:`, error);
    }
  }

  private async indexArtifact(event: DomainEvent): Promise<void> {
    console.log(`[IndexingSubscriber] ContextDocument models removed. Skipping indexing.`);
  }
}

export const indexingSubscriber = new IndexingSubscriber();
