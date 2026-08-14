export class PromptPolicyEngine {
  async evaluate(experimentId: string, candidateId: string, metrics: any): Promise<boolean> {
    console.log(`[PromptPolicyEngine] Prompt policy models removed. Returning default pass.`);
    return metrics.variance <= 10.0 && metrics.repairRate <= 0.15;
  }
}

export const promptPolicyEngine = new PromptPolicyEngine();
