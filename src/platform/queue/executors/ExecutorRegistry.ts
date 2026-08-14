import { RuntimeJob, JobType } from '../interfaces/RuntimeJob';

export interface JobExecutor {
  execute(job: RuntimeJob): Promise<any>;
}

export class ExecutorRegistry {
  private static instance: ExecutorRegistry;
  private executors: Map<JobType | string, JobExecutor> = new Map();

  private constructor() {}

  public static getInstance(): ExecutorRegistry {
    if (!ExecutorRegistry.instance) {
      ExecutorRegistry.instance = new ExecutorRegistry();
    }
    return ExecutorRegistry.instance;
  }

  public register(type: JobType | string, executor: JobExecutor): void {
    this.executors.set(type, executor);
  }

  public get(type: JobType | string): JobExecutor {
    const executor = this.executors.get(type);
    if (!executor) {
      throw new Error(`[ExecutorRegistry] No executor registered for job type: ${type}`);
    }
    return executor;
  }
}
