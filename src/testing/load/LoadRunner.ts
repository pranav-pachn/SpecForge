import { notImplemented, TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class LoadRunner implements TestStage {
  readonly name = 'Load';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    context.logger.info('[LoadRunner] Load generation is not implemented. A pass here would claim capacity that was never measured.');
    context.metrics.record(this.name, 'implemented', 0, 'count');
    return notImplemented(this.name);
  }
}
