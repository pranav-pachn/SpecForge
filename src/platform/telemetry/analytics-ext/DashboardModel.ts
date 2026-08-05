import { MetricSet } from "./MetricCollector";
import { Trend } from "./TrendCalculator";

export interface DashboardModel {
  overview: {
    quality: number;      // Mapped from coverage/validation
    velocity: number;     // Mapped from cycleTime / leadTime
    reliability: number;  // Mapped from driftResolution
    governance: number;   // Mapped from approvalHealth
    aiAdoption: number;   // Mapped from confidence
    overallMaturity: number;
  };
  trends: Record<string, Trend | null>;
  comparisons: {
    teamScores: { teamId: string; teamName: string; score: number }[];
  };
  recommendations: string[];
}
