import { EvaluationFinding } from "../evaluation/interfaces/EvaluationResult";

export type RepairStrategy = "EXPAND" | "REWRITE" | "CONSTRAIN";

export interface RepairDiagnosis {
  findings: EvaluationFinding[];
  targetSections: string[];
  recommendedStrategy: RepairStrategy;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface RepairPlan {
  diagnosis: RepairDiagnosis;
  targetSections: string[];
  strategy: RepairStrategy;
  confidence: number;
}

export interface RepairResult {
  artifact: string;
  repairedSections: string[];
  attempts: number;
  durationMs: number;
  confidence: number;
}
