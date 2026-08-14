export interface NormalizedChange {
  operation: "ADD" | "REMOVE" | "UPDATE" | "REPLACE" | "RENAME" | "MOVE";
  source: string;
  target?: string;
  entityType?: string; // e.g., "DATABASE", "API", "SERVICE", "LIBRARY"
}

export interface Tradeoff {
  benefit: string;
  cost: string;
}

export interface ReasoningReport {
  tradeoffs: Tradeoff[];
  risks: string[];
  impactSummary: string;
}

export interface AdvisorAlternative {
  name: string;
  description: string;
}

export interface AdvisorRecommendation {
  decision: "PROCEED" | "DELAY" | "REJECT" | "INVESTIGATE";
  confidence: number;
  reasons: string[];
  alternatives: AdvisorAlternative[];
  evidenceConfidence: {
    graph: number;
    memory: number;
    rag: number;
    reasoning: number;
  };
  decisionFactors?: {
    graph: number;
    memory: number;
    documentation: number;
    reasoning: number;
  };
}
