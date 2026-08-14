export interface ExperimentReport {
  experimentId: string;
  winner: string | null; // Candidate ID or Variant ID
  confidence: number;
  recommendation: "PROMOTE" | "REJECT" | "MORE_DATA";
  metrics: {
    meanScore: number;
    variance: number;
    p95Latency: number;
    medianScore: number;
    repairRate: number;
    cost: number;
  }[];
}
