import { ApprovalEngine } from "../enterprise/governance/approval/ApprovalEngine";
import { PermissionGuard } from "../enterprise/governance/rbac/PermissionGuard";

export class ApprovalApplicationService {
  
  /**
   * Orchestrates submitting a vote.
   * Ensures RBAC/auth checks pass before reaching the Engine.
   */
  static async submitVote(
    orgId: string,
    projectId: string | null,
    requestId: string,
    userId: string,
    status: "APPROVED" | "REJECTED",
    comment?: string
  ) {
    // Basic check: must be a member of the organization to vote
    await PermissionGuard.requireOrgRole(orgId, "MEMBER", userId);

    // In a fully robust system, we would also evaluate if the user 
    // actually holds the specific role required for this step.
    // e.g. await PermissionGuard.hasRoleString(orgId, projectId, step.requiredRole, userId);
    
    const vote = await ApprovalEngine.submitVote(requestId, userId, status, comment, orgId);
    return vote;
  }
}
