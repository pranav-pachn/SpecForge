import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { WorkflowStatus, ArtifactType, ArtifactVersionStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { WorkflowApplicationService } from "@/workflow/engine/WorkflowApplicationService";

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
    let targetOrgId = null;

    if (!targetProjectId) {
      const orgMember = await db.orgMember.findFirst({
        where: { userId: user.id },
        include: { organization: { include: { projects: true } } },
      });

      if (!orgMember?.organization.projects[0]) {
        // Automatically create an org and project if the user doesn't have one
        const orgName = `${user.name || user.email?.split("@")[0] || 'User'}'s Organization`;
        const newOrg = await db.organization.create({
          data: {
            name: orgName,
            slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
            ownerId: user.id,
            plan: "FREE",
            members: {
              create: {
                userId: user.id,
                role: "OWNER",
              },
            },
            projects: {
              create: {
                name: "Default Project",
                description: "Your first project",
              },
            },
          },
          include: { projects: true },
        });
        targetProjectId = newOrg.projects[0].id;
        targetOrgId = newOrg.id;
      } else {
        targetProjectId = orgMember.organization.projects[0].id;
        targetOrgId = orgMember.organization.id;
      }
    } else {
      const proj = await db.project.findUnique({ where: { id: targetProjectId } });
      if (!proj || !proj.organizationId) return apiError("Invalid project");
      targetOrgId = proj.organizationId;
    }

    const workflow = await WorkflowApplicationService.createWorkflow(
      targetOrgId,
      targetProjectId,
      name,
      user.id
    );

    return jsonResponse(workflow, 201);
  } catch (error: any) {
    console.error(error);
    return apiError(error.message || "Failed to create workflow", 500);
  }
}