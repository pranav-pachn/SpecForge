import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { ArtifactVersionStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const version = await db.artifactVersion.findUnique({
      where: { id: params.versionId },
      include: {
        artifact: { include: { workflow: true } },
        clarifications: { include: { answer: true } },
        tasks: true,
        executionPacks: true,
        reviewChecks: true,
        validationChecks: true,
      },
    });

    if (!version) return apiError("Version not found", 404);
    if (version.artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    return jsonResponse(version);
  } catch (error) {
    return apiError("Failed to fetch version", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const version = await db.artifactVersion.findUnique({
      where: { id: params.versionId },
      include: { artifact: { include: { workflow: true } } },
    });

    if (!version) return apiError("Version not found", 404);
    if (version.artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const { content, status } = await req.json();

    const updated = await db.artifactVersion.update({
      where: { id: params.versionId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(status ? { status: status as ArtifactVersionStatus } : {}),
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    return apiError("Failed to update version", 500);
  }
}
