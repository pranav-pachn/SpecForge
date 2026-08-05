import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";
import { DriftEventStatus } from "@prisma/client";

export class DriftProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    const whereClause: any = { 
      status: DriftEventStatus.RESOLVED,
      workflowVersion: {
        workflow: { organizationId: orgId }
      }
    };
    if (teamId) whereClause.workflowVersion.workflow.teamId = teamId;

    const resolvedEvents = await db.driftEvent.findMany({
      where: whereClause,
      select: { createdAt: true, resolvedAt: true },
      take: 100,
      orderBy: { resolvedAt: "desc" }
    });

    if (resolvedEvents.length === 0) return null;

    let totalDays = 0;
    for (const event of resolvedEvents) {
      if (event.resolvedAt) {
        const diffTime = Math.abs(event.resolvedAt.getTime() - event.createdAt.getTime());
        totalDays += diffTime / (1000 * 60 * 60 * 24); 
      }
    }

    return totalDays / resolvedEvents.length;
  }
}
