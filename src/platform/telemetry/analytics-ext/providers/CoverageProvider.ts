import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";

export class CoverageProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    // We'll use Validation Pass Rate as a proxy for Coverage for now.
    const whereClause: any = { 
      workflow: { organizationId: orgId }
    };
    if (teamId) whereClause.workflow.teamId = teamId;

    const validations = await db.validationReport.findMany({
      where: whereClause,
      select: { status: true },
      take: 200,
      orderBy: { generatedAt: "desc" }
    });

    if (validations.length === 0) return null;

    const passed = validations.filter(v => v.status === "PASSED" || v.status === "COMPLETED").length;
    return Math.round((passed / validations.length) * 100);
  }
}
