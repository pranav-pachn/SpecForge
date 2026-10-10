import { PlatformTestContext } from './PlatformTestContext';

export interface TestStageResult {
  passed: boolean;
  status?: 'PASSED' | 'FAILED' | 'NOT_IMPLEMENTED';
  message?: string;
  error?: Error;
}

export function notImplemented(stage: string): TestStageResult {
  return {
    passed: false,
    status: 'NOT_IMPLEMENTED',
    message: `${stage} is NOT_IMPLEMENTED. It previously reported success without executing.`,
  };
}

export interface TestStage {
  readonly name: string;
  execute(context: PlatformTestContext): Promise<TestStageResult>;
}
