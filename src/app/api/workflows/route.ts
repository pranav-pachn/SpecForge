import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { WorkflowStatus, ArtifactType, ArtifactVersionStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { logEvent } from "@/lib/instrumentation";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") as WorkflowStatus | null;

  try {
    const workflows = await db.workflow.findMany({
      where: {
        creatorId: user.id,
        ...(status ? { status } : {}),
      },
      include: {
        artifacts: {
          include: {
            versions: {
              orderBy: { version: "desc" },
              take: 1, // Only need latest version to check status
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return jsonResponse(workflows);
  } catch (error) {
    return apiError("Failed to fetch workflows", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { name, projectId } = await req.json();

    if (!name) {
      return apiError("Workflow name is required");
    }

    // Default to user's first project if none provided
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const workspaceMember = await db.workspaceMember.findFirst({
        where: { userId: user.id },
        include: { workspace: { include: { projects: true } } },
      });

      if (!workspaceMember?.workspace.projects[0]) {
        return apiError("No default project found for user", 400);
      }
      targetProjectId = workspaceMember.workspace.projects[0].id;
    }

    // Create workflow and its first SPEC artifact draft in a transaction
    const workflow = await db.$transaction(async (tx) => {
      const newWorkflow = await tx.workflow.create({
        data: {
          name,
          projectId: targetProjectId,
          creatorId: user.id,
          status: WorkflowStatus.DRAFT,
        },
      });

      await tx.artifact.create({
        data: {
          workflowId: newWorkflow.id,
          type: ArtifactType.SPEC,
          title: "Feature Specification",
          versions: {
            create: {
              version: 1,
              content: "",
              status: ArtifactVersionStatus.DRAFT,
            },
          },
        },
      });

      return newWorkflow;
    });

    // Log the event without awaiting
    logEvent("WORKFLOW_CREATED", { 
      workflowId: workflow.id, 
      userId: user.id,
      metadata: { name }
    });

    return jsonResponse(workflow, 201);
  } catch (error) {
    return apiError("Failed to create workflow", 500);
  }
}