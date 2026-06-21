import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { ArtifactType } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return apiError("workflowId is required", 400);
  }

  try {
    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const artifacts = await db.artifact.findMany({
      where: { workflowId },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return jsonResponse(artifacts);
  } catch (error) {
    return apiError("Failed to fetch artifacts", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, type, title } = await req.json();

    if (!workflowId || !type || !title) {
      return apiError("workflowId, type, and title are required");
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const artifact = await db.artifact.create({
      data: {
        workflowId,
        type: type as ArtifactType,
        title,
      },
    });

    return jsonResponse(artifact, 201);
  } catch (error) {
    return apiError("Failed to create artifact", 500);
  }
}