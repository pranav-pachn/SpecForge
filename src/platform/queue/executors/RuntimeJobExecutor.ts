import { RuntimeJob } from '../interfaces/RuntimeJob';
import { ExecutorRegistry } from './ExecutorRegistry';

export class RuntimeJobExecutor {
  /**
   * Routes the job to the correct registered executor for execution.
   */
  public async execute(job: RuntimeJob): Promise<any> {
    const registry = ExecutorRegistry.getInstance();
    const executor = registry.get(job.type);
    
    return await executor.execute(job);
  }
}

export const runtimeJobExecutor = new RuntimeJobExecutor();
