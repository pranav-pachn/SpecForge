import { Indexer } from "./Indexer";

interface QueueItem {
  workflowId: string;
  artifactType: string;
  artifactId: string;
  version: number;
  content: string;
}

export class EmbeddingQueue {
  private static queue: QueueItem[] = [];
  private static processing = false;

  static push(item: QueueItem) {
    this.queue.push(item);
    // Fire and forget
    this.processNext().catch(e => console.error("[EmbeddingQueue] Error", e));
  }

  static getQueueLength() {
    return this.queue.length;
  }

  private static async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;

      try {
        console.log(`[EmbeddingQueue] Indexing artifact ${item.artifactType} for workflow ${item.workflowId}`);
        await Indexer.indexArtifact(item.workflowId, item.artifactType, item.artifactId, item.version, item.content);
        console.log(`[EmbeddingQueue] Finished indexing ${item.artifactType}`);
      } catch (err) {
        console.error(`[EmbeddingQueue] Failed to index artifact ${item.artifactId}`, err);
      }
    }

    this.processing = false;
  }
}
