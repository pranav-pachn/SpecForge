import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { WorkflowStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const workflow = await db.workflow.findUnique({
      where: {
        id: params.id,
        creatorId: user.id, // Basic authorization for MVP
      },
      include: {
        artifacts: {
          include: {
            versions: {
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
        tasks: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!workflow) return apiError("Workflow not found", 404);

    return jsonResponse(workflow);
  } catch (error) {
    return apiError("Failed to fetch workflow", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { name, status } = await req.json();

    const workflow = await db.workflow.update({
      where: {
        id: params.id,
        creatorId: user.id,
      },
      data: {
        ...(name ? { name } : {}),
        ...(status ? { status: status as WorkflowStatus } : {}),
      },
    });

    return jsonResponse(workflow);
  } catch (error) {
    return apiError("Failed to update workflow", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    await db.workflow.delete({
      where: {
        id: params.id,
        creatorId: user.id,
      },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return apiError("Failed to delete workflow", 500);
  }
}
