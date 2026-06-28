import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");
  const versionId = searchParams.get("versionId");

  if (!workflowId && !versionId) {
    return apiError("workflowId or versionId is required", 400);
  }

  try {
    const tasks = await db.task.findMany({
      where: {
        ...(workflowId ? { workflowId } : {}),
        ...(versionId ? { versionId } : {}),
        workflow: { creatorId: user.id },
      },
      include: {
        dependencies: { include: { dependsOn: true } },
        executionPacks: true,
      },
      orderBy: { order: "asc" },
    });

    return jsonResponse(tasks);
  } catch (error) {
    return apiError("Failed to fetch tasks", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId, versionId, title, description, priority, order } = await req.json();

    if (!workflowId || !versionId || !title) {
      return apiError("workflowId, versionId, and title are required");
    }

    // Verify workflow belongs to user
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
    });
    if (!workflow) return apiError("Workflow not found", 404);

    const task = await db.task.create({
      data: {
        workflowId,
        versionId,
        title,
        description,
        priority,
        order: order || 0,
      },
    });

    return jsonResponse(task, 201);
  } catch (error) {
    return apiError("Failed to create task", 500);
  }
}
