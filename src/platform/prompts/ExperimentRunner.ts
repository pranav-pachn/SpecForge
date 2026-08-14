import { ExperimentReport } from "./interfaces/ExperimentReport";

export class ExperimentRunner {
  async runExperiment(experimentId: string): Promise<ExperimentReport> {
    console.log(`[ExperimentRunner] Prompt experiment models removed. Returning mock report.`);
    return {
      experimentId,
      winner: null,
      confidence: 0,
      recommendation: "REJECT",
      metrics: []
    };
  }
}

export const experimentRunner = new ExperimentRunner();
