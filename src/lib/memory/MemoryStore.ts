import { db } from "../db";
import { MemoryType, MemorySeverity, MemoryStatus } from "@prisma/client";
import { DecisionTrace } from "./MemorySchema";
import { MemoryConsolidator } from "../intelligence/memory/MemoryConsolidator";

export class MemoryStore {
  static async saveDecision(
    workflowId: string,
    sourceVersionId: string,
    memoryType: MemoryType,
    severity: MemorySeverity,
    status: MemoryStatus,
    trace: DecisionTrace,
    oldContent: string | null = null,
    newContent: string | null = null
  ) {
    const memoryIdToConsolidate = await MemoryConsolidator.shouldConsolidate(workflowId, memoryType, trace);

    if (memoryIdToConsolidate) {
      return this.addRevision(memoryIdToConsolidate, trace, oldContent, newContent);
    }

    // Generate DEC-XXX identifier
    const count = await db.engineeringMemory.count({
      where: { workflowId }
    });
    const decisionId = `DEC-${(count + 1).toString().padStart(3, '0')}`;

    const memory = await db.engineeringMemory.create({
      data: {
        decisionId,
        workflowId,
        memoryType,
        severity,
        status,
        title: trace.title,
        description: trace.description,
        reason: trace.reason,
        sourceVersionId,
        createdBy: "AI_DECISION",
        confidence: trace.confidenceScore ?? 1.0,
        confidenceSources: trace.confidenceSources ? JSON.stringify(trace.confidenceSources) : undefined,
      }
    });

    // Create a relationship from Memory to its Source Version
    await db.memoryRelationship.create({
      data: {
        sourceType: "MEMORY",
        sourceId: memory.id,
        targetType: "ARTIFACT_VERSION",
        targetId: sourceVersionId,
        relationType: "BASED_ON"
      }
    });

    // Add the initial revision implicitly
    await db.memoryRevision.create({
      data: {
        memoryId: memory.id,
        revision: 1,
        title: trace.title,
        description: trace.description,
        reason: trace.reason,
        oldContent,
        newContent,
      }
    });

    return memory;
  }

  static async addRevision(
    memoryId: string,
    trace: DecisionTrace,
    oldContent: string | null,
    newContent: string | null
  ) {
    const existing = await db.engineeringMemory.findUnique({ where: { id: memoryId } });
    if (!existing) throw new Error("Memory not found for consolidation");

    const newRevisionCount = existing.revisionCount + 1;
    const consolidatedTitle = `${existing.title.split(' (')[0]} (${newRevisionCount} revisions)`;

    await db.engineeringMemory.update({
      where: { id: memoryId },
      data: {
        revisionCount: newRevisionCount,
        lastRevisedAt: new Date(),
        consolidatedTitle,
      }
    });

    await db.memoryRevision.create({
      data: {
        memoryId,
        revision: newRevisionCount,
        title: trace.title,
        description: trace.description,
        reason: trace.reason,
        oldContent,
        newContent,
      }
    });

    return existing;
  }
}
