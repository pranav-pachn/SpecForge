import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { TaskStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    const { title, description, status, priority, order } = await req.json();

    const updated = await db.task.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status ? { status: status as TaskStatus } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(order !== undefined ? { order } : {}),
      },
    });

    return jsonResponse(updated);
  } catch (error) {
    return apiError("Failed to update task", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: { workflow: true },
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    await db.task.delete({
      where: { id: params.id },
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return apiError("Failed to delete task", 500);
  }
}
