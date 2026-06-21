import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { DriftEntityType } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");
  const resolvedParam = searchParams.get("resolved");

  if (!workflowId) {
    return apiError("workflowId is required", 400);
  }

  try {
    const driftEvents = await db.driftEvent.findMany({
      where: {
        version: {
          artifact: { workflowId, workflow: { creatorId: user.id } },
        },
        ...(resolvedParam !== null ? { resolved: resolvedParam === "true" } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        version: { include: { artifact: true } },
        sourceVersion: { include: { artifact: true } },
      },
    });

    return jsonResponse(driftEvents);
  } catch (error) {
    return apiError("Failed to fetch drift events", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { versionId, sourceVersionId, entityType, entityId, description } = await req.json();

    if (!versionId || !entityType || !entityId || !description) {
      return apiError("Missing required fields");
    }

    // Basic auth check
    const version = await db.artifactVersion.findUnique({
      where: { id: versionId },
      include: { artifact: { include: { workflow: true } } },
    });

    if (!version) return apiError("Version not found", 404);
    if (version.artifact.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const driftEvent = await db.driftEvent.create({
      data: {
        versionId,
        sourceVersionId,
        entityType: entityType as DriftEntityType,
        entityId,
        description,
      },
    });

    return jsonResponse(driftEvent, 201);
  } catch (error) {
    return apiError("Failed to create drift event", 500);
  }
}
