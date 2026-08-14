import { PlatformTestContext } from './PlatformTestContext';

export interface TestStageResult {
  passed: boolean;
  message?: string;
  error?: Error;
}

export interface TestStage {
  readonly name: string;
  execute(context: PlatformTestContext): Promise<TestStageResult>;
}
