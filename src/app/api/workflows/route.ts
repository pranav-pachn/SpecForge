import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { WorkflowStatus, ArtifactType, ArtifactVersionStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { WorkflowApplicationService } from "@/workflow/engine/WorkflowApplicationService";
import { SimulationReportGenerator } from "@/platform/sandbox/SimulationReportGenerator";

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

    const generator = new SimulationReportGenerator();
    
    const enrichedWorkflows = await Promise.all(workflows.map(async wf => {
      // For MVP, we use the workflow ID. In future, this would be a specific executionId.
      const report = await generator.generate(wf.id);
      
      // Calculate a "tasks completed" stat if we have tasks.
      // We don't fetch tasks here directly, but we can derive progress from the report.
      
      return {
        ...wf,
        simulationReport: report
      };
    }));

    return jsonResponse(enrichedWorkflows);
  } catch (error) {
    return apiError("Failed to fetch workflows", 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { name, projectId, rawIdea } = await req.json();

    if (!name) {
      return apiError("Workflow name is required");
    }

    // Default to user's first project if none provided
    let targetProjectId = projectId;
    let targetOrgId = null;

    if (!targetProjectId) {
      let org = await db.organization.findFirst({
        where: { ownerId: user.id },
        include: { projects: true, members: { where: { userId: user.id } } }
      });

      if (!org) {
        // Not an owner. Are they a member of someone else's org?
        const orgMember = await db.orgMember.findFirst({
          where: { userId: user.id },
          include: { organization: { include: { projects: true } } },
        });

        if (orgMember) {
          org = { ...orgMember.organization, members: [orgMember] } as any;
        }
      }

      if (!org) {
        // Automatically create an org and project if the user has none
        const orgName = `${user.name || user.email?.split("@")[0] || 'User'}'s Organization`;
        org = await db.organization.create({
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
          include: { projects: true, members: { where: { userId: user.id } } },
        });
      } else if (org.members.length === 0) {
        // Fix corrupted state: User owns org but lacks an OrgMember record
        const newMember = await db.orgMember.create({
          data: {
            userId: user.id,
            organizationId: org.id,
            role: "OWNER"
          }
        });
        org.members = [newMember];
      }

      if (!org.projects || org.projects.length === 0) {
        // User has an org but no projects, create a default project in existing org
        const newProject = await db.project.create({
          data: {
            name: "Default Project",
            description: "Your first project",
            organizationId: org.id,
          }
        });
        // Add user as ADMIN to the new project
        await db.projectMember.create({
          data: {
            userId: user.id,
            projectId: newProject.id,
            role: "ADMIN"
          }
        });
        org.projects = [newProject];
      }

      targetProjectId = org.projects[0].id;
      targetOrgId = org.id;
    } else {
      const proj = await db.project.findUnique({ where: { id: targetProjectId } });
      if (!proj || !proj.organizationId) return apiError("Invalid project");
      targetOrgId = proj.organizationId;
    }

    const workflow = await WorkflowApplicationService.createWorkflow(
      targetOrgId,
      targetProjectId,
      name,
      user.id,
      rawIdea
    );

    return jsonResponse(workflow, 201);
  } catch (error: any) {
    console.error(error);
    return apiError(error.message || "Failed to create workflow", 500);
  }
}