import { CycleTimeProvider } from "./providers/CycleTimeProvider";
import { DriftProvider } from "./providers/DriftProvider";
import { ReviewProvider } from "./providers/ReviewProvider";
import { CoverageProvider } from "./providers/CoverageProvider";
import { ConfidenceProvider } from "./providers/ConfidenceProvider";
import { ApprovalHealthProvider } from "./providers/ApprovalHealthProvider";

export interface MetricSet {
  cycleTime: number | null;
  leadTime: number | null;
  driftResolution: number | null;
  reviewScore: number | null;
  coverage: number | null;
  confidence: number | null;
  approvalHealth: number | null;
  maturityScore: number | null;
}

export class MetricCollector {
  static async collect(orgId: string, teamId?: string | null): Promise<MetricSet> {
    const cycleTime = await new CycleTimeProvider().calculate(orgId, teamId);
    const driftResolution = await new DriftProvider().calculate(orgId, teamId);
    const reviewScore = await new ReviewProvider().calculate(orgId, teamId);
    const coverage = await new CoverageProvider().calculate(orgId, teamId);
    const confidence = await new ConfidenceProvider().calculate(orgId, teamId);
    const approvalHealth = await new ApprovalHealthProvider().calculate(orgId, teamId);

    // Lead time is usually cycle time + planning time. For MVP, we can approximate it or leave it null
    const leadTime = cycleTime ? cycleTime * 1.2 : null; 

    const maturityScore = this.calculateMaturityScore(coverage, reviewScore, confidence, driftResolution, approvalHealth);

    return {
      cycleTime,
      leadTime,
      driftResolution,
      reviewScore,
      coverage,
      confidence,
      approvalHealth,
      maturityScore
    };
  }

  private static calculateMaturityScore(
    coverage: number | null, 
    reviewScore: number | null, 
    confidence: number | null,
    driftResolution: number | null,
    approvalHealth: number | null
  ): number | null {
    // We only calculate if we have at least some basic data
    if (coverage === null && reviewScore === null) return null;

    // Default missing scores to neutral 50 for the sake of the formula
    const c = coverage ?? 50;
    const r = reviewScore ?? 50;
    const cf = confidence ?? 50;
    const ah = approvalHealth ?? 50;
    
    // Drift resolution: lower is better. Let's say < 2 days = 100 score, > 14 days = 0 score.
    const drDays = driftResolution ?? 7;
    const drScore = Math.max(0, 100 - (drDays * (100/14))); 

    /*
      Coverage 25%
      Validation (implied in coverage) 20% -> We'll just weigh coverage heavily for MVP
      Review 20%
      Decision Confidence 15%
      Drift Health 10%
      Approval Health 10%
    */
    
    // Adjusted MVP Weights:
    // Coverage: 45%
    // Review: 20%
    // Confidence: 15%
    // Drift: 10%
    // Approval: 10%

    const score = (c * 0.45) + (r * 0.20) + (cf * 0.15) + (drScore * 0.10) + (ah * 0.10);
    return Math.round(score);
  }
}
