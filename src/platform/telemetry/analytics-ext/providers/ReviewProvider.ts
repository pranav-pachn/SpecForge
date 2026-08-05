import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";

export class ReviewProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    const whereClause: any = { 
      workflow: { organizationId: orgId }
    };
    if (teamId) whereClause.workflow.teamId = teamId;

    const reviews = await db.engineeringReview.findMany({
      where: whereClause,
      select: { overallScore: true },
      take: 100, // Look at the last 100 for a moving average
      orderBy: { generatedAt: "desc" }
    });

    if (reviews.length === 0) return null;

    const total = reviews.reduce((sum, r) => sum + r.overallScore, 0);
    return Math.round(total / reviews.length);
  }
}
