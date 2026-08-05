import { db } from "@/platform/storage/db";
import { DashboardModel } from "./DashboardModel";
import { TrendCalculator } from "./TrendCalculator";
import { RecommendationEngine } from "./RecommendationEngine";
import { RollupPeriod } from "@prisma/client";
import { MetricSet } from "./MetricCollector";

export class DashboardService {
  static async getDashboard(orgId: string, teamId: string | null = null): Promise<DashboardModel> {
    // 1. Fetch current and previous DAILY rollups to compute trends
    const rollups = await db.metricRollup.findMany({
      where: {
        organizationId: orgId,
        teamId: teamId || null,
        period: RollupPeriod.DAILY
      },
      orderBy: { date: "desc" },
      take: 2
    });

    const currentRollup = rollups[0] || this.getEmptyMetricSet();
    const previousRollup = rollups[1] || null;

    // 2. Map MetricSet back to the metric values
    const currentMetrics: MetricSet = {
      cycleTime: currentRollup.cycleTime,
      leadTime: currentRollup.leadTime,
      driftResolution: currentRollup.driftResolution,
      reviewScore: currentRollup.reviewScore,
      coverage: currentRollup.coverage,
      confidence: currentRollup.confidence,
      approvalHealth: currentRollup.approvalHealth,
      maturityScore: currentRollup.maturityScore
    };

    const previousMetrics: MetricSet | null = previousRollup ? {
      cycleTime: previousRollup.cycleTime,
      leadTime: previousRollup.leadTime,
      driftResolution: previousRollup.driftResolution,
      reviewScore: previousRollup.reviewScore,
      coverage: previousRollup.coverage,
      confidence: previousRollup.confidence,
      approvalHealth: previousRollup.approvalHealth,
      maturityScore: previousRollup.maturityScore
    } : null;

    // 3. Calculate Trends
    const trends = TrendCalculator.calculate(currentMetrics, previousMetrics);

    // 4. Generate Recommendations
    const recommendations = RecommendationEngine.generate(currentMetrics);

    // 5. Fetch Team Comparisons (if org-level request)
    let teamScores: { teamId: string; teamName: string; score: number }[] = [];
    if (!teamId) {
      const allTeams = await db.team.findMany({ where: { organizationId: orgId } });
      for (const t of allTeams) {
        const tr = await db.metricRollup.findFirst({
          where: { teamId: t.id, period: RollupPeriod.DAILY },
          orderBy: { date: "desc" }
        });
        if (tr && tr.maturityScore) {
          teamScores.push({ teamId: t.id, teamName: t.name, score: tr.maturityScore });
        }
      }
      teamScores.sort((a, b) => b.score - a.score);
    }

    // 6. Map to Dimensions (Rough heuristic mapping for MVP)
    const quality = currentMetrics.coverage ?? 50;
    const velocity = currentMetrics.cycleTime ? Math.max(0, 100 - (currentMetrics.cycleTime * 5)) : 50;
    const reliability = currentMetrics.driftResolution ? Math.max(0, 100 - (currentMetrics.driftResolution * 10)) : 50;
    const governance = currentMetrics.approvalHealth ?? 50;
    const aiAdoption = currentMetrics.confidence ?? 50;
    const overallMaturity = currentMetrics.maturityScore ?? 50;

    return {
      overview: {
        quality,
        velocity,
        reliability,
        governance,
        aiAdoption,
        overallMaturity
      },
      trends,
      comparisons: { teamScores },
      recommendations
    };
  }

  private static getEmptyMetricSet(): any {
    return {
      cycleTime: null, leadTime: null, driftResolution: null,
      reviewScore: null, coverage: null, confidence: null,
      approvalHealth: null, maturityScore: null
    };
  }
}
