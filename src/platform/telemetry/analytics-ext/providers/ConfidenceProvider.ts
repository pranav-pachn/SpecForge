import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";

export class ConfidenceProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    const whereClause: any = { 
      workflow: { organizationId: orgId },
      confidence: { not: null }
    };
    if (teamId) whereClause.workflow.teamId = teamId;

    const memories = await db.engineeringMemory.findMany({
      where: whereClause,
      select: { confidence: true },
      take: 200,
      orderBy: { createdAt: "desc" }
    });

    if (memories.length === 0) return null;

    const total = memories.reduce((sum, m) => sum + (m.confidence || 0), 0);
    return Math.round((total / memories.length) * 100); // Assuming confidence is 0.0 - 1.0, convert to 0-100
  }
}
