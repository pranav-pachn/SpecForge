import { OrgRole, ProjectRole } from "@prisma/client";
import { PermissionCache } from "./PermissionCache";
import { getAuthenticatedUser } from "@/infrastructure/services/api-helpers";

export class PermissionGuard {
  
  /**
   * Helper to throw an error if authorization fails.
   */
  private static deny(message: string): never {
    throw new Error(`Forbidden: ${message}`);
  }

  /**
   * Evaluates if a user meets the minimum organization role requirement.
   * Ranks: OWNER (highest) > ADMIN > MEMBER (lowest)
   */
  static async requireOrgRole(orgId: string, minRole: OrgRole, userId?: string) {
    const resolvedUserId = userId ?? (await getAuthenticatedUser())?.id;
    if (!resolvedUserId) this.deny("Not authenticated");

    const roles = await PermissionCache.getUserRoles(orgId, resolvedUserId);
    
    if (!roles.orgRole) {
      this.deny("Not a member of this organization");
    }

    const roleRanks: Record<OrgRole, number> = {
      OWNER: 3,
      ADMIN: 2,
      MEMBER: 1
    };

    if (roleRanks[roles.orgRole] < roleRanks[minRole]) {
      this.deny(`Requires organization role ${minRole} or higher`);
    }
  }

  /**
   * Evaluates if a user meets the minimum project role requirement.
   * Implicit inheritance: Org OWNER/ADMIN are implicitly Project ADMINs.
   * Ranks: ADMIN (highest) > EDITOR > VIEWER (lowest)
   */
  static async requireProjectRole(orgId: string, projectId: string, minRole: ProjectRole, userId?: string) {
    const resolvedUserId = userId ?? (await getAuthenticatedUser())?.id;
    if (!resolvedUserId) this.deny("Not authenticated");

    const roles = await PermissionCache.getUserRoles(orgId, resolvedUserId);

    // 1. Check for implicit organization-level override
    if (roles.orgRole === "OWNER" || roles.orgRole === "ADMIN") {
      return; // Admins and Owners have implicit Project ADMIN access
    }

    if (!roles.orgRole) {
      this.deny("Not a member of this organization");
    }

    // 2. Check explicit project role
    const projectRole = roles.projectRoles[projectId];

    if (!projectRole) {
      this.deny("Not a member of this project");
    }

    const roleRanks: Record<ProjectRole, number> = {
      ADMIN: 3,
      EDITOR: 2,
      VIEWER: 1
    };

    if (roleRanks[projectRole] < roleRanks[minRole]) {
      this.deny(`Requires project role ${minRole} or higher`);
    }
  }

  /**
   * Generic check against custom strings (used by PolicyEngine).
   * Supports resolving strings like "ARCHITECT" or standard roles like "ADMIN".
   */
  static async hasRoleString(orgId: string, projectId: string | null, requiredRoleStr: string, userId: string): Promise<boolean> {
    const roles = await PermissionCache.getUserRoles(orgId, userId);
    
    // Check against standard Org roles
    if (roles.orgRole === requiredRoleStr) return true;
    
    // Check against standard Project roles
    if (projectId && roles.projectRoles[projectId] === requiredRoleStr) return true;

    // Check against standard Team roles
    // If the string represents a team role (e.g., "SECURITY_LEAD"), we'd need more complex team mapping.
    // For now, if they have any team where they hold this role, we could approve it, 
    // but typically we'd map "SECURITY" to a team name.
    
    return false;
  }
}
