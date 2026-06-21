import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const driftEvent = await db.driftEvent.findUnique({
      where: { id: params.id },
      include: {
        version: { include: { artifact: { include: { workflow: true } } } },
      },
    });

    if (!driftEvent) return apiError("Drift event not found", 404);
    if (driftEvent.version.artifact.workflow.creatorId !== user.id) {
      return apiError("Unauthorized", 401);
    }

    const { resolved } = await req.json();

    if (resolved === undefined) {
      return apiError("resolved field is required", 400);
    }

    const updated = await db.driftEvent.update({
      where: { id: params.id },
      data: { resolved },
    });

    return jsonResponse(updated);
  } catch (error) {
    return apiError("Failed to update drift event", 500);
  }
}
