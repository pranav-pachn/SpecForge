import { notImplemented, TestStage, TestStageResult } from '../core/TestStage';
import { PlatformTestContext } from '../core/PlatformTestContext';

export class WorkflowIntegrationRunner implements TestStage {
  readonly name = 'Integration';

  async execute(context: PlatformTestContext): Promise<TestStageResult> {
    context.logger.info('[WorkflowIntegrationRunner] Integration scenarios are not implemented. Refusing to report a pass.');
    context.metrics.record(this.name, 'implemented', 0, 'count');
    return notImplemented(this.name);
  }
}
