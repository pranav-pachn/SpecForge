import { db } from "@/platform/storage/db";
import { RollupPeriod } from "@prisma/client";
import { MetricSet } from "./MetricCollector";

export class MetricRollupRepository {
  /**
   * Upserts a Rollup for the specified period.
   * By default, aligns the `date` to the start of the period.
   */
  static async upsert(orgId: string, teamId: string | null, period: RollupPeriod, metrics: MetricSet): Promise<void> {
    const date = this.getPeriodStartDate(period);

    await db.metricRollup.upsert({
      where: {
        organizationId_teamId_period_date: {
          organizationId: orgId,
          teamId: teamId || "",
          period,
          date
        }
      },
      update: {
        cycleTime: metrics.cycleTime,
        leadTime: metrics.leadTime,
        driftResolution: metrics.driftResolution,
        reviewScore: metrics.reviewScore,
        coverage: metrics.coverage,
        confidence: metrics.confidence,
        approvalHealth: metrics.approvalHealth,
        maturityScore: metrics.maturityScore
      },
      create: {
        organizationId: orgId,
        teamId: teamId || null,
        period,
        date,
        cycleTime: metrics.cycleTime,
        leadTime: metrics.leadTime,
        driftResolution: metrics.driftResolution,
        reviewScore: metrics.reviewScore,
        coverage: metrics.coverage,
        confidence: metrics.confidence,
        approvalHealth: metrics.approvalHealth,
        maturityScore: metrics.maturityScore
      }
    });
  }

  private static getPeriodStartDate(period: RollupPeriod): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);

    if (period === "WEEKLY") {
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      d.setUTCDate(diff);
    } else if (period === "MONTHLY") {
      d.setUTCDate(1);
    }

    return d;
  }
}
