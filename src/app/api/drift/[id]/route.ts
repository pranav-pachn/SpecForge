import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { DriftEventStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { status } = await req.json();

    const driftEvent = await db.driftEvent.findUnique({
      where: { id: params.id },
      include: { version: { include: { artifact: { include: { workflow: true } } } } },
    });

    if (!driftEvent) return apiError("Drift event not found", 404);
    if (driftEvent.version.artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const updated = await db.driftEvent.update({
      where: { id: params.id },
      data: { status: status as DriftEventStatus },
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error("Drift Resolve Error:", error);
    return apiError("Failed to resolve drift event", 500);
  }
}
