import { db } from "@/lib/db";
import { ActivityItem } from "./ActivityItem";
import { FeedFormatter } from "./FeedFormatter";

export class EventInspector {
  
  /**
   * Reconstructs an entire event chain based on a shared correlationId.
   * Useful for debugging complex cascading workflows (e.g. Workflow Created -> Spec Generated -> Graph Updated).
   */
  static async getCorrelationChain(orgId: string, correlationId: string): Promise<ActivityItem[]> {
    const logs = await db.auditLog.findMany({
      where: { 
        organizationId: orgId,
        correlationId
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" } // For a timeline chain, chronological order is usually better
    });

    return logs.map(FeedFormatter.format);
  }
}
