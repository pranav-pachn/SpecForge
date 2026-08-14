import { ExperimentPlan, PromptHypothesis } from "./interfaces/ExperimentPlan";

export class PromptExperimentPlanner {
  async buildPlan(capability: string, provider: string, model: string): Promise<ExperimentPlan> {
    console.log(`[PromptExperimentPlanner] Prompt evaluation models removed. Returning default plan.`);
    const hypothesis: PromptHypothesis = {
      description: "General optimization",
      variables: ["systemPrompt"],
      expectedMetric: "OVERALL_SCORE",
      expectedDelta: 5,
      confidence: 0.8
    };
    return {
      hypothesis,
      candidateCount: 3,
      benchmarkSuite: `${capability}_REGRESSION_SUITE`,
      benchmarkProfile: "QUICK"
    };
  }
}

export const promptExperimentPlanner = new PromptExperimentPlanner();
