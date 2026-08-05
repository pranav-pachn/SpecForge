import { MetricSet } from "./MetricCollector";

export class RecommendationEngine {
  static generate(metrics: MetricSet): string[] {
    const recommendations: string[] = [];

    if (metrics.confidence !== null && metrics.confidence < 70) {
      recommendations.push("Increase test coverage and run more automated validations to boost Engineering Confidence.");
    }

    if (metrics.driftResolution !== null && metrics.driftResolution > 7) {
      recommendations.push("Architecture drift resolution is taking over a week. Prioritize drift alerts to maintain architectural integrity.");
    }

    if (metrics.reviewScore !== null && metrics.reviewScore < 75) {
      recommendations.push("Engineering Review scores are dropping. Focus on coding standards and early security checks.");
    }

    if (metrics.cycleTime !== null && metrics.cycleTime > 14) {
      recommendations.push("Cycle time is high. Consider breaking workflows into smaller, more manageable specifications.");
    }

    if (recommendations.length === 0 && metrics.maturityScore && metrics.maturityScore > 85) {
      recommendations.push("Engineering Maturity is excellent. Continue current practices.");
    }

    return recommendations;
  }
}
