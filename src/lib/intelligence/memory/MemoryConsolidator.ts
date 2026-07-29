import { db } from "@/lib/db";
import { DecisionTrace } from "@/lib/memory/MemorySchema";
import { MemoryType } from "@prisma/client";

export class MemoryConsolidator {
  /**
   * Checks if a new decision should be consolidated into an existing active memory.
   * Groups rapid/related decisions to avoid cluttering the timeline.
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
      // Intelligent semantic clustering mockup
      const similarity = this.calculateSimilarity(memory.title, memory.description, trace.title, trace.description);
      
      if (similarity > 0.8) {
        return memory.id;
      }
    }

    return null;
  }

  private static calculateSimilarity(title1: string, desc1: string, title2: string, desc2: string): number {
    const text1 = (title1 + " " + desc1).toLowerCase();
    const text2 = (title2 + " " + desc2).toLowerCase();
    
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
