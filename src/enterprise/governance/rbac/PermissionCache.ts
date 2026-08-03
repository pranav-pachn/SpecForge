import { db } from "@/lib/db";
import { OrgRole, ProjectRole, TeamRole } from "@prisma/client";

interface UserRoles {
  orgRole?: OrgRole;
  projectRoles: Record<string, ProjectRole>;
  teamRoles: Record<string, TeamRole>;
}

interface CacheEntry {
  roles: UserRoles;
  expiresAt: number;
}

/**
 * In-memory Permission Cache to prevent redundant database lookups
 * during a single request or across short-lived requests.
 * 
 * Future: Move to Redis for distributed caching.
 */
export class PermissionCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  private static getCacheKey(orgId: string, userId: string): string {
    return `${orgId}:${userId}`;
  }

  /**
   * Resolves and caches all roles (Org, Project, Team) for a user in an organization.
   */
  static async getUserRoles(orgId: string, userId: string, skipCache = false): Promise<UserRoles> {
    const key = this.getCacheKey(orgId, userId);

    if (!skipCache) {
      const entry = this.cache.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.roles;
      }
    }

    const roles: UserRoles = {
      projectRoles: {},
      teamRoles: {}
    };

    // 1. Fetch Org Role
    const orgMember = await db.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId
        }
      }
    });

    if (orgMember) {
      roles.orgRole = orgMember.role;
    }

    // 2. Fetch Project Roles
    const projectMembers = await db.projectMember.findMany({
      where: {
        userId,
        project: {
          organizationId: orgId
        }
      }
    });

    for (const pm of projectMembers) {
      roles.projectRoles[pm.projectId] = pm.role;
    }

    // 3. Fetch Team Roles
    const teamMembers = await db.teamMember.findMany({
      where: {
        userId,
        team: {
          organizationId: orgId
        }
      }
    });

    for (const tm of teamMembers) {
      roles.teamRoles[tm.teamId] = tm.role;
    }

    // Cache the result
    this.cache.set(key, {
      roles,
      expiresAt: Date.now() + this.TTL_MS
    });

    return roles;
  }

  /**
   * Invalidates the cache for a specific user in an organization.
   */
  static invalidate(orgId: string, userId: string) {
    this.cache.delete(this.getCacheKey(orgId, userId));
  }

  /**
   * Invalidates all cache entries (useful for testing or global resets).
   */
  static flush() {
    this.cache.clear();
  }
}
