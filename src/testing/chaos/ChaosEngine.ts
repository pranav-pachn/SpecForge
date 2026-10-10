import { notImplemented, TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class ChaosEngine implements TestStage {
  readonly name = 'Chaos';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    context.logger.info('[ChaosEngine] Chaos injection is not implemented. Refusing to report a pass.');
    context.metrics.record(this.name, 'implemented', 0, 'count');
    return notImplemented(this.name);
  }
}
