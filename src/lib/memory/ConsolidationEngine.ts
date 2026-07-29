import { db } from "../db";
import { DecisionTrace } from "./MemorySchema";
import { MemoryType } from "@prisma/client";

export class ConsolidationEngine {
  /**
   * Checks if a new decision should be consolidated into an existing active memory.
   * Rules:
   * 1. Same workflowId and artifactType (memoryType).
   * 2. Within a 12-hour window.
   * 3. High similarity of intent (mocked as > 80% similarity for MVP).
   * 
   * Returns the memoryId to consolidate into, or null if a new memory should be created.
   */
  static async shouldConsolidate(
    workflowId: string,
    memoryType: MemoryType,
    trace: DecisionTrace
  ): Promise<string | null> {
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    const windowStart = new Date(Date.now() - TWELVE_HOURS);

    // Find recent active memories of the same type
    const recentMemories = await db.engineeringMemory.findMany({
      where: {
        workflowId,
        memoryType,
        status: "ACTIVE",
        OR: [
          { lastRevisedAt: { gte: windowStart } },
          { createdAt: { gte: windowStart } }
        ]
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    for (const memory of recentMemories) {
      // In a production system with vector embeddings, we would do a semantic similarity search here.
      // For the MVP, we use a heuristic based on title/description overlap.
      const similarity = this.calculateSimilarity(memory.title, memory.description, trace.title, trace.description);
      
      if (similarity > 0.8) {
        return memory.id;
      }
    }

    return null;
  }

  /**
   * Mock similarity calculation for MVP.
   * Returns a score between 0.0 and 1.0.
   */
  private static calculateSimilarity(title1: string, desc1: string, title2: string, desc2: string): number {
    const text1 = (title1 + " " + desc1).toLowerCase();
    const text2 = (title2 + " " + desc2).toLowerCase();
    
    // Simple Jaccard index based on words
    const words1 = new Set(text1.split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.split(/\W+/).filter(w => w.length > 3));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let intersection = 0;
    for (const w of Array.from(words1)) {
      if (words2.has(w)) intersection++;
    }
    
    const union = words1.size + words2.size - intersection;
    return intersection / union;
  }
}
