import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";

export class CycleTimeProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    const whereClause: any = { organizationId: orgId, status: "COMPLETED" };
    if (teamId) whereClause.teamId = teamId;

    const completedWorkflows = await db.workflow.findMany({
      where: whereClause,
      select: { createdAt: true, updatedAt: true } // Assuming updatedAt is when it was completed
    });

    if (completedWorkflows.length === 0) return null;

    let totalDays = 0;
    for (const wf of completedWorkflows) {
      const diffTime = Math.abs(wf.updatedAt.getTime() - wf.createdAt.getTime());
      totalDays += diffTime / (1000 * 60 * 60 * 24); 
    }

    return totalDays / completedWorkflows.length;
  }
}
