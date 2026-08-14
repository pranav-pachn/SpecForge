import { ExperimentPlan } from "./interfaces/ExperimentPlan";

export class PromptGenerator {
  async generateCandidates(
    capability: string,
    provider: string,
    model: string,
    plan: ExperimentPlan,
    triggerReason: string
  ): Promise<string> {
    console.log(`[PromptGenerator] Prompt experiment models removed. Returning mock experimentId.`);
    return "mock-experiment-id";
  }
}

export const promptGenerator = new PromptGenerator();
