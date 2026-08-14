export interface BenchmarkTarget {
  providerId: string;
  modelId: string;
  promptVariantId: string;
  contextPolicyId?: string;
}

export class BenchmarkRunner {
  async runSuite(
    runId: string, 
    suiteId: string, 
    profileId: string, 
    targets: BenchmarkTarget[]
  ): Promise<void> {
    console.log(`[BenchmarkRunner] Benchmark models removed. Skipping run.`);
  }
}

export const benchmarkRunner = new BenchmarkRunner();

