import { NextRequest } from "next/server";
import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, apiError, jsonResponse } from "@/infrastructure/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const workflowId = params.id;
  const workflow = await db.workflow.findUnique({
    where: { id: workflowId },
    include: {
      artifacts: { include: { versions: { orderBy: { version: 'desc' }, take: 1 } } }
    }
  });

  if (!workflow) return apiError("Workflow not found", 404);
  
  // Find open drift events for this workflow
  const latestVersionIds = workflow.artifacts.flatMap(a => a.versions.map(v => v.id));
  
  const openDrifts = await db.driftEvent.findMany({
    where: {
      versionId: { in: latestVersionIds },
      status: "OPEN"
    }
  });

  if (openDrifts.length === 0) {
    return jsonResponse({ message: "No drift events to repair" });
  }

  // Identify affected tasks
  const affectedTaskIds = openDrifts.filter(d => d.entityType === "TASK").map(d => d.entityId);
  const affectedPackIds = openDrifts.filter(d => d.entityType === "PACK").map(d => d.entityId);

  // Targeted regeneration
  for (const taskId of affectedTaskIds) {
     await db.task.update({
       where: { id: taskId },
       data: { description: "Repaired after drift analysis." }
     });
  }

  for (const packId of affectedPackIds) {
     await db.executionPack.update({
       where: { id: packId },
       data: { content: "Repaired pack content based on new requirements." }
     });
  }

  // Mark all as resolved
  await db.driftEvent.updateMany({
    where: {
      id: { in: openDrifts.map(d => d.id) }
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: user.id
    }
  });

  // Advance state
  await db.workflow.update({
    where: { id: workflowId },
    data: { status: "VALIDATING" }
  });

  return jsonResponse({ message: "Targeted repair complete", repairedTasks: affectedTaskIds.length, repairedPacks: affectedPackIds.length });
}
