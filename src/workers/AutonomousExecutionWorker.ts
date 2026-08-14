import { JobType } from "../platform/queue/interfaces/RuntimeJob";

export class AutonomousExecutionWorker {
  public readonly jobType = JobType.AUTONOMOUS_EXECUTION || "AUTONOMOUS_EXECUTION";

  async process(jobId: string): Promise<void> {
    console.log(`[AutonomousExecutionWorker] ExecutionSession models removed. Skipping job ${jobId}.`);
  }
}
