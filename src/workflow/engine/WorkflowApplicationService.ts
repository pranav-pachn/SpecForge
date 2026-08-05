import { db } from "@/platform/storage/db";
import { WorkflowStatus, ArtifactType, ArtifactVersionStatus } from "@prisma/client";
import { PermissionGuard } from '@/platform/governance/rbac/PermissionGuard';
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';
import { PolicyEngine } from '@/platform/governance/policy/PolicyEngine';
import { EventFactory } from '@/platform/events/factory/EventFactory';

export class WorkflowApplicationService {
  
  /**
   * Orchestrates the creation of a Workflow.
   * Ensures RBAC, evaluates Policies, executes the DB transaction, and emits domain events.
   */
  static async createWorkflow(
    organizationId: string, 
    projectId: string, 
    name: string, 
    userId: string
  ) {
    // 1. RBAC Check: Ensure the user has at least EDITOR access on the project
    //    or ADMIN access implicitly via Org roles.
    await PermissionGuard.requireProjectRole(organizationId, projectId, "EDITOR", userId);

    // 2. Policy Evaluation: Check if there's any strict policy for Workflow creation
    //    e.g., Only ADMINs can create workflows in highly regulated orgs.
    const policyAction = await PolicyEngine.evaluate(organizationId, "WORKFLOW", "ON_CREATE");
    
    if (policyAction.type === "REQUIRE_APPROVAL") {
      // In this case, we might still create it as DRAFT, but require approval to move to PLANNING.
      // Or we could block creation outright based on roles.
      // For simplicity, we just enforce the roles right now if the policy specifies required roles.
      let hasRequiredRole = false;
      for (const roleStr of policyAction.roles) {
        if (await PermissionGuard.hasRoleString(organizationId, projectId, roleStr, userId)) {
          hasRequiredRole = true;
          break;
        }
      }

      if (!hasRequiredRole) {
        throw new Error("Policy Denied: You do not have the required roles to create a workflow.");
      }
    }

    // 3. Database Transaction
    const workflow = await db.$transaction(async (tx) => {
      const newWorkflow = await tx.workflow.create({
        data: {
          name,
          projectId,
          organizationId,
          creatorId: userId,
          status: WorkflowStatus.DRAFT,
        },
      });

      // Automatically seed the first SPEC artifact
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

    // 4. Domain Event Emission (PlatformEventBus)
    // This replaces `logEvent` inline and routes to AuditLog, Analytics, and Intelligence
    await PlatformEventBus.publish(EventFactory.workflowCreated({
      organizationId,
      name,
      projectId
    }, { workflowId: workflow.id, userId }));

    return workflow;
  }

}
