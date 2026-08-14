export type EvaluationSeverity = "INFO" | "WARN" | "ERROR" | "CRITICAL";

export interface EvaluationFinding {
  severity: EvaluationSeverity;
  message: string;
  location?: string;
}

export interface EvaluationResult {
  evaluatorId: string;
  score: number; // 0-100
  confidence: number; // 0-1
  passed: boolean;
  findings: EvaluationFinding[];
  recommendations: string[];
  
  // Analytics
  executionTime?: number;
  tokensConsumed?: number;
  cost?: number;

  metadata?: Record<string, unknown>;
}
