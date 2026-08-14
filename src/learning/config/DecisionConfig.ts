export interface DecisionPolicyConfig {
  policyVersion: string;
  minimumConfirmedBenchmarks: number;
  maximumRejectedBenchmarks: number;
  minimumPrimaryImprovement?: number;
  requireAllGuardrailsPass: boolean;
  allowInconclusiveBenchmarks: boolean;
  inconclusiveRequiresHumanReview: boolean;
  criticalRegressionRequiresReview: boolean;
}

export const DecisionConfig: Record<string, DecisionPolicyConfig> = {
  'AUTO_ACCEPT_V1': {
    policyVersion: 'AUTO_ACCEPT_V1',
    minimumConfirmedBenchmarks: 2,
    maximumRejectedBenchmarks: 0,
    requireAllGuardrailsPass: true,
    allowInconclusiveBenchmarks: true,
    inconclusiveRequiresHumanReview: true,
    criticalRegressionRequiresReview: false // Critical -> Auto-reject usually, unless override
  }
};
