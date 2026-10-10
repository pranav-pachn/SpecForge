import { notImplemented, TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class PerformanceProfiler implements TestStage {
  readonly name = 'Profiling';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    context.logger.info('[PerformanceProfiler] Profiling is not implemented. Refusing to report a pass.');
    context.metrics.record(this.name, 'implemented', 0, 'count');
    return notImplemented(this.name);
  }
}
