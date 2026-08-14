import { EvaluationResult } from "../interfaces/EvaluationResult";

export interface EvaluationReport {
  id: string;
  workflowId: string;
  capability: string;
  results: EvaluationResult[];
  aggregate: { 
    overall: number; 
    passed: boolean; 
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; 
    breakdown: Record<string, number>;
  };
  recommendations: string[];
  evaluatedAt: Date;
}
