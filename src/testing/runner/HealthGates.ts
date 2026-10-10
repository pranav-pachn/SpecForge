import { MetricsRegistry } from '../metrics/MetricsRegistry';
import { Logger } from '../../platform/observability/Logger';

export interface HealthThresholds {
  integrationSuccess: number;
  validationAccuracy: number;
  chaosRecovery: number;
  memoryConsistency: number;
  queueFailures: number;
}

export const STRICT_THRESHOLDS: HealthThresholds = {
  integrationSuccess: 1, // 100%
  validationAccuracy: 0.98,
  chaosRecovery: 0.95,
  memoryConsistency: 1, // 100%
  queueFailures: 0
};

const REQUIRED_METRICS: Array<{ name: string; min: keyof HealthThresholds; higherIsBetter: boolean }> = [
  { name: 'integration_success', min: 'integrationSuccess', higherIsBetter: true },
  { name: 'validation_accuracy', min: 'validationAccuracy', higherIsBetter: true },
  { name: 'chaos_recovery', min: 'chaosRecovery', higherIsBetter: true },
  { name: 'memory_consistency', min: 'memoryConsistency', higherIsBetter: true },
  { name: 'queue_failures', min: 'queueFailures', higherIsBetter: false },
];

export class HealthGates {
  static evaluate(metrics: MetricsRegistry, thresholds: HealthThresholds, logger: Logger): boolean {
    logger.info('[HealthGates] Evaluating recorded metrics. Missing metrics fail.');

    const failures: string[] = [];
    for (const required of REQUIRED_METRICS) {
      const samples = metrics.getMetricsByName(required.name);
      if (samples.length === 0) {
        failures.push(`${required.name} was not recorded`);
        continue;
      }
      const value = samples[samples.length - 1].value;
      const threshold = thresholds[required.min];
      const ok = required.higherIsBetter ? value >= threshold : value <= threshold;
      if (!ok) failures.push(`${required.name}=${value} did not meet ${String(required.min)}=${threshold}`);
    }

    if (failures.length === 0) {
      logger.info('[HealthGates] All recorded thresholds met.');
      return true;
    }

    for (const failure of failures) logger.error(`[HealthGates] ${failure}`);
    return false;
  }
}
