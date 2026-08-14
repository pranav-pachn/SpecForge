import { JobType } from "../platform/queue/interfaces/RuntimeJob";

export class BenchmarkWorker {
  public readonly jobType = JobType.BENCHMARK || "BENCHMARK";

  async process(jobId: string): Promise<void> {
    console.log(`[BenchmarkWorker] RuntimeJob models removed. Skipping benchmark job ${jobId}.`);
  }
}
