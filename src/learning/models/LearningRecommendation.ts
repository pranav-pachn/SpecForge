export type RecommendationType =
  | 'PROMPT_UPDATE'
  | 'PROMPT_VARIANT_SWITCH'
  | 'WORKFLOW_TUNING'
  | 'EXECUTION_TUNING'
  | 'PERFORMANCE_OPTIMIZATION'
  | 'REPAIR_STRATEGY'
  | 'INVESTIGATION';

export type RecommendationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPERIMENT' | 'BENCHMARKED' | 'PROMOTED' | 'SUPERSEDED';

export type RecommendationAction = 
  | 'SWITCH_PROMPT_VARIANT'
  | 'CREATE_PROMPT_VARIANT'
  | 'ADJUST_TIMEOUT'
  | 'ADJUST_RETRY_POLICY'
  | 'ADJUST_CHUNK_SIZE'
  | 'INVESTIGATE_STAGE';

export interface ProposedChange {
  action: RecommendationAction;
  target: {
    type: 'agent' | 'stage' | 'workflow' | 'system';
    id: string; // e.g. "architecture", "stage-eval", "architecture-v7"
    variant?: string; // used for agent variant targets
  };
  candidate?: {
    configuration?: Record<string, unknown>;
    prompt?: string;
    variantId?: string;
  };
  constraints?: string[];
}

export interface LearningRecommendationRecord {
  patternId: string;
  type: RecommendationType;
  status: RecommendationStatus;
  proposedChange: ProposedChange;
  rationale: string;
  expectedImpact: string;
  confidence: number;
  evidence: any;
  generator: string;
  generatorVersion: string;
  fingerprint: string;
}
