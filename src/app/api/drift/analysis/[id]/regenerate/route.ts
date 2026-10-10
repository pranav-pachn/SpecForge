import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { planSelectiveRegeneration } from "@/workflow/drift/selectivePlan";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const body = await req.json().catch(() => ({}));
    const selections = body.selections as { taskIds?: string[]; eventIds?: string[] } | undefined;

    const analysis = await db.driftAnalysis.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!analysis) return apiError("Drift analysis not found", 404);
    if (analysis.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const openEvents = await db.driftEvent.findMany({
      where: {
        status: "OPEN",
        OR: [{ versionId: analysis.oldVersionId }, { versionId: analysis.newVersionId }],
      },
    });

    const plan = planSelectiveRegeneration(openEvents, selections);
    if (!plan.ok) return apiError(plan.reason, 400);

    const existingTasks = await db.task.findMany({
      where: { id: { in: plan.updateTaskIds }, workflowId: analysis.workflowId },
    });
    const existingIds = new Set(existingTasks.map((task) => task.id));
    const missing = plan.updateTaskIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      return apiError(`Cannot regenerate missing tasks: ${missing.join(", ")}. Their drift events stay open.`, 409);
    }

    const note = `Updated for drift analysis ${analysis.id} against spec version ${analysis.newVersionId}.`;

    await db.$transaction(async (tx) => {
      for (const task of existingTasks) {
        const alreadyNoted = task.description?.includes(analysis.id);
        await tx.task.update({
          where: { id: task.id },
          data: {
            description: alreadyNoted ? task.description : `${task.description ?? ""}\n${note}`.trim(),
          },
        });
      }

      if (plan.resolveEventIds.length > 0) {
        await tx.driftEvent.updateMany({
          where: { id: { in: plan.resolveEventIds } },
          data: {
            status: "RESOLVED",
            resolvedAt: new Date(),
            resolvedBy: user.id,
          },
        });
      }

      await tx.driftAnalysis.update({
        where: { id: analysis.id },
        data: { status: plan.remainingOpen === 0 ? "RESOLVED" : "PARTIAL" },
      });
    });

    return jsonResponse({
      analysisId: analysis.id,
      status: plan.remainingOpen === 0 ? "RESOLVED" : "PARTIAL",
      updatedTaskIds: plan.updateTaskIds,
      resolvedEventIds: plan.resolveEventIds,
      remainingOpen: plan.remainingOpen,
    });
  } catch (error) {
    console.error("Selective Regeneration Error:", error);
    return apiError("Failed to regenerate artifacts", 500);
  }
}
