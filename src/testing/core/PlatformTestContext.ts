import { PlatformTestConfig } from '../config/PlatformTestConfig';
import { MetricsRegistry } from '../metrics/MetricsRegistry';
import { TraceCollector } from '../metrics/TraceCollector';
import { Logger } from '../../platform/observability/Logger';

export interface PlatformTestContext {
  id: string;
  config: PlatformTestConfig;
  metrics: MetricsRegistry;
  traces: TraceCollector;
  logger: Logger;
  state: Record<string, any>; // Used to pass data between stages
}
