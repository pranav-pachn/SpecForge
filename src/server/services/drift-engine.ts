import { db } from "@/lib/db";
import { ArtifactType } from "@prisma/client";

/**
 * Handles identifying and marking downstream artifacts as STALE 
 * when an upstream artifact (like SPEC or PLAN) is updated.
 */
export async function handleArtifactDrift(
  workflowId: string, 
  updatedArtifactType: ArtifactType, 
  oldVersionId: string, 
  newVersionId: string
) {
  // If SPEC is updated, it drifts the PLAN (we mark it STALE)
  // and it also drifts Review/Validation checks.
  if (updatedArtifactType === "SPEC") {
    // Find the PLAN artifact for this workflow
    const planArtifact = await db.artifact.findFirst({
      where: { workflowId, type: "PLAN" },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } }
    });

    if (planArtifact && planArtifact.versions.length > 0) {
      const planVersion = planArtifact.versions[0];
      
      // If plan is approved or needs review, we mark it stale
      if (planVersion.status === "APPROVED" || planVersion.status === "NEEDS_REVIEW") {
        await db.artifactVersion.update({
          where: { id: planVersion.id },
          data: { status: "STALE" }
        });
      }
    }

    // Mark Validation Checks as drifted
    const validations = await db.validationCheck.findMany({
      where: { versionId: oldVersionId }
    });

    for (const v of validations) {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId, 
          sourceVersionId: newVersionId,
          entityType: "VALIDATION",
          entityId: v.id,
          description: "Specification was updated. This validation check may be stale.",
          resolved: false
        }
      });
    }
  }

  // If PLAN is updated, it drifts the TASKS
  if (updatedArtifactType === "PLAN") {
    // Find all tasks linked to the old plan version
    const impactedTasks = await db.task.findMany({
      where: { workflowId, versionId: oldVersionId }
    });

    for (const task of impactedTasks) {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId,
          sourceVersionId: newVersionId,
          entityType: "TASK",
          entityId: task.id,
          description: "Implementation plan was updated. This task may be stale.",
          resolved: false
        }
      });
    }

    // Execution packs derived from the old plan version are also stale
    const impactedPacks = await db.executionPack.findMany({
      where: { versionId: oldVersionId }
    });

    for (const pack of impactedPacks) {
      await db.driftEvent.create({
        data: {
          versionId: oldVersionId,
          sourceVersionId: newVersionId,
          entityType: "PACK",
          entityId: pack.id,
          description: "Implementation plan was updated. This execution pack may be stale.",
          resolved: false
        }
      });
    }
  }
}
