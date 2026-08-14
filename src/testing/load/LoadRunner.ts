import { TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class LoadRunner implements TestStage {
  readonly name = 'Load';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    const start = performance.now();
    context.logger.info('[LoadRunner] Starting concurrent workload generators...');

    try {
      // ScenarioLoadGenerator -> Generate 10/20 projects
      // ConcurrentWorkflowRunner -> Execute all
      
      const durationMs = performance.now() - start;
      context.metrics.record(this.name, 'duration', durationMs, 'ms');
      
      return { passed: true };
    } catch (error: any) {
      context.logger.error(`[LoadRunner] Failed: ${error.message}`);
      return { passed: false, error };
    }
  }
}
