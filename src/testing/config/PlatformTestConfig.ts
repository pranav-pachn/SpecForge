export interface PlatformTestConfig {
  maxConcurrentWorkflows: number;
  defaultScenarioCount: number;
  chaosInjectionProbability: number;
  performanceThresholds: {
    maxLatencyMs: number;
    maxMemoryMb: number;
  };
  reportsOutputPath: string;
  timeoutMs: number;
}

export const defaultConfig: PlatformTestConfig = {
  maxConcurrentWorkflows: 10,
  defaultScenarioCount: 10,
  chaosInjectionProbability: 0.1,
  performanceThresholds: {
    maxLatencyMs: 15000,
    maxMemoryMb: 512,
  },
  reportsOutputPath: 'src/testing/reports',
  timeoutMs: 300000, // 5 minutes
};
