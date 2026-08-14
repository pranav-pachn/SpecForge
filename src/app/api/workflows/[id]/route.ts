import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
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
              include: { reviewChecks: true },
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

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  DRAFT: ["CLARIFYING"],
  CLARIFYING: ["SPEC_REVIEW"],
  SPEC_REVIEW: ["PLANNING"],
  PLANNING: ["WAITING_FOR_APPROVAL", "TASK_BREAKDOWN"],
  WAITING_FOR_APPROVAL: ["TASK_BREAKDOWN", "PLANNING"],
  TASK_BREAKDOWN: ["READY_FOR_EXECUTION"],
  READY_FOR_EXECUTION: ["EXECUTING"],
  EXECUTING: ["ENGINEERING_REVIEW", "REVIEWING"],
  ENGINEERING_REVIEW: ["REVIEWING"],
  REVIEWING: ["VALIDATING"],
  VALIDATING: ["COMPLETED", "DRAFT"],
  COMPLETED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { name, status } = await req.json();

    if (status) {
      const currentWorkflow = await db.workflow.findUnique({
        where: { id: params.id, creatorId: user.id },
      });
      if (!currentWorkflow) return apiError("Workflow not found", 404);
      
      const currentStatus = currentWorkflow.status;
      if (status !== currentStatus) {
        if (!VALID_TRANSITIONS[currentStatus].includes(status as WorkflowStatus)) {
          return apiError(`Invalid status transition from ${currentStatus} to ${status}`, 400);
        }

        // Approval Gate: CLARIFYING -> SPEC_REVIEW
        if (currentStatus === 'CLARIFYING' && status === 'SPEC_REVIEW') {
          const specArtifact = await db.artifact.findFirst({
            where: { workflowId: params.id, type: 'SPEC' },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
          });
          const versionId = specArtifact?.versions?.[0]?.id;
          if (versionId) {
            const questions = await db.clarificationQuestion.findMany({
              where: { versionId }
            });
            const requiredUnanswered = questions.filter(
              q => q.impact && (q.impact as any).isRequired === true && q.status === 'OPEN'
            ).length;
            
            if (requiredUnanswered > 0) {
              return apiError(`Cannot proceed: ${requiredUnanswered} required decisions are still open.`, 422);
            }
          }
        }

        // Approval Gate: SPEC_REVIEW -> PLANNING
        if (currentStatus === 'SPEC_REVIEW' && status === 'PLANNING') {
          const specArtifact = await db.artifact.findFirst({
            where: { workflowId: params.id, type: 'SPEC' },
            include: { versions: { orderBy: { version: 'desc' }, take: 1, include: { reviewChecks: true } } }
          });
          const checks = specArtifact?.versions?.[0]?.reviewChecks ?? [];
          const requiredChecks = ["REQUIREMENT_COVERAGE", "TEST_COVERAGE", "ASSUMPTION_RISK", "CONSISTENCY"];
          const blockingChecks = requiredChecks.filter((type) => {
            const check = checks.find((c) => c.type === type);
            return !check || (check.status !== "PASSED" && check.status !== "SKIPPED");
          });

          if (blockingChecks.length > 0) {
            return apiError(
              `Specification cannot be approved. Blocking checks: ${blockingChecks.join(', ')}`,
              422
            );
          }
        }
      }
    }

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
