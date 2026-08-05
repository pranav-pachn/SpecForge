import { MetricSet } from "./MetricCollector";

export interface Trend {
  value: number; // e.g. +12 (improved) or -5 (declined)
  label: string; // e.g. "Improving" or "Declining"
}

export class TrendCalculator {
  static calculate(current: MetricSet, previous: MetricSet | null): Record<string, Trend | null> {
    if (!previous) {
      return { cycleTime: null, maturityScore: null }; // Base case
    }

    return {
      cycleTime: this.computeInvertedTrend(current.cycleTime, previous.cycleTime), // Lower is better
      maturityScore: this.computeTrend(current.maturityScore, previous.maturityScore) // Higher is better
    };
  }

  private static computeTrend(curr: number | null, prev: number | null): Trend | null {
    if (curr === null || prev === null || prev === 0) return null;
    const diff = curr - prev;
    const percent = Math.round((diff / prev) * 100);
    return {
      value: percent,
      label: percent > 0 ? "Improving" : percent < 0 ? "Declining" : "Stable"
    };
  }

  private static computeInvertedTrend(curr: number | null, prev: number | null): Trend | null {
    if (curr === null || prev === null || prev === 0) return null;
    const diff = prev - curr; // Invert logic for lower is better
    const percent = Math.round((diff / prev) * 100);
    return {
      value: percent, // Positive means it dropped (which is good)
      label: percent > 0 ? "Improving" : percent < 0 ? "Declining" : "Stable"
    };
  }
}
