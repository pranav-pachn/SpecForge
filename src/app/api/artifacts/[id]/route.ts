import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const artifact = await db.artifact.findUnique({
      where: { id: params.id },
      include: {
        workflow: true,
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });

    if (!artifact) return apiError("Artifact not found", 404);
    if (artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    return jsonResponse(artifact);
  } catch (error) {
    return apiError("Failed to fetch artifact", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const artifact = await db.artifact.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!artifact) return apiError("Artifact not found", 404);
    if (artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const { title } = await req.json();

    const updated = await db.artifact.update({
      where: { id: params.id },
      data: {
        ...(title ? { title } : {}),
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    return apiError("Failed to update artifact", 500);
  }
}
