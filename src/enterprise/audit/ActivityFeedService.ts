import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ActivityItem } from "./ActivityItem";
import { FeedFormatter } from "./FeedFormatter";

export class ActivityFeedService {
  
  /**
   * Retrieves the activity feed for an entire organization.
   */
  static async getOrgActivity(orgId: string, limit: number = 50, cursor?: string): Promise<ActivityItem[]> {
    const logs = await db.auditLog.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true } } },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return logs.map(FeedFormatter.format);
  }

  /**
   * Retrieves the activity feed for a specific entity (e.g. a Workflow or Project).
   */
  static async getEntityActivity(orgId: string, entityType: string, entityId: string, limit: number = 50, cursor?: string): Promise<ActivityItem[]> {
    const logs = await db.auditLog.findMany({
      where: { 
        organizationId: orgId,
        entityType,
        entityId
      },
      include: { user: { select: { id: true, name: true } } },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return logs.map(FeedFormatter.format);
  }

  /**
   * Retrieves activity specific to a user.
   */
  static async getUserActivity(orgId: string, userId: string, limit: number = 50, cursor?: string): Promise<ActivityItem[]> {
    const logs = await db.auditLog.findMany({
      where: { 
        organizationId: orgId,
        userId
      },
      include: { user: { select: { id: true, name: true } } },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" }
    });

    return logs.map(FeedFormatter.format);
  }
}
