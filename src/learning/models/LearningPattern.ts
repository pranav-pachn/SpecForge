export type PatternSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PatternType = 
  | "STAGE_FAILURE_PATTERN"
  | "STAGE_LATENCY_PATTERN"
  | "PROMPT_DEGRADATION"
  | "PROMPT_VARIANT_INFERIOR"
  | "REPAIR_LOOP";

export interface PatternEvidence {
  sampleSize: number;
  baseline: Record<string, number | null>;
  observed: Record<string, number | null>;
  difference: number;
  executionIds: string[];
  analysisWindow: {
    from: Date | null;
    to: Date | null;
  };
  [key: string]: any; // Allows custom evidence fields per analyzer
}

export interface LearningPatternRecord {
  fingerprint: string;
  type: PatternType;
  severity: PatternSeverity;
  confidence: number;
  description: string;
  evidence: PatternEvidence;
  detector: string;
  detectorVersion: string;
}
