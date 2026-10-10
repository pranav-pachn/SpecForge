import { notImplemented, TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class ValidationEngine implements TestStage {
  readonly name = 'Validation';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    context.logger.info('[ValidationEngine] Snapshot comparison is not implemented. Refusing to report a pass.');
    context.metrics.record(this.name, 'implemented', 0, 'count');
    return notImplemented(this.name);
  }
}
