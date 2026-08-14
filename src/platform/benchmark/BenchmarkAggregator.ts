import { db } from "../storage/db";

export interface LeaderboardEntry {
  provider: string;
  model: string;
  promptVariantId: string;
  contextPolicyId: string | null;
  overallScore: number;
  latencyMs: number;
  costUsd: number;
  repairRate: number;
  reliability: number;
  contextEfficiency: number;
  groundingScore: number;
}

export class BenchmarkAggregator {
  
  /**
   * Retrieves the leaderboard for a specific suite across all runs.
   * Ranks by a composite score or specifically requested metric.
   */
  async getLeaderboard(suiteId: string, orderBy: keyof LeaderboardEntry = "overallScore"): Promise<LeaderboardEntry[]> {
    console.log(`[BenchmarkAggregator] Benchmark models removed. Returning mock data.`);
    return [];
  }
}

export const benchmarkAggregator = new BenchmarkAggregator();
