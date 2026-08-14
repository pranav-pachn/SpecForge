import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PlatformTestContext } from '../core/PlatformTestContext';
import { defaultConfig } from '../config/PlatformTestConfig';
import { MetricsRegistry } from '../metrics/MetricsRegistry';
import { Logger } from '../../platform/observability/Logger';

// Stages
import { WorkflowIntegrationRunner } from '../integration/WorkflowIntegrationRunner';
import { PerformanceProfiler } from '../profiling/PerformanceProfiler';
import { ChaosEngine } from '../chaos/ChaosEngine';
import { LoadRunner } from '../load/LoadRunner';
import { ValidationEngine } from '../validation/ValidationEngine';
import { TestStage } from '../core/TestStage';

// Runner utilities
import { HealthGates, STRICT_THRESHOLDS } from './HealthGates';
import { ReportGenerator } from '../reports/ReportGenerator';

const stageRegistry: Record<string, TestStage> = {
  integration: new WorkflowIntegrationRunner(),
  profiling: new PerformanceProfiler(),
  chaos: new ChaosEngine(),
  load: new LoadRunner(),
  validation: new ValidationEngine()
};

async function main() {
  const logger = new Logger('QA-Platform');
  logger.info('🚀 Initializing SpecForge Engineering Validation Platform...');

  // 1. Setup Context
  const context: PlatformTestContext = {
    id: crypto.randomUUID(),
    config: defaultConfig,
    metrics: new MetricsRegistry(),
    traces: new (require('../metrics/TraceCollector').TraceCollector)(),
    logger,
    state: {}
  };

  // 2. Load Manifest
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  // 3. Execute Stages Sequentially
  for (const stageName of manifest.stages) {
    const stage = stageRegistry[stageName];
    if (!stage) {
      logger.error(`Unknown stage in manifest: ${stageName}`);
      process.exit(1);
    }

    const result = await stage.execute(context);
    if (!result.passed) {
      logger.error(`❌ Stage '${stageName}' failed catastrophically.`);
      process.exit(1);
    }
  }

  // 4. Evaluate Health Gates
  const healthy = HealthGates.evaluate(context.metrics, STRICT_THRESHOLDS, logger);

  // 5. Generate Immutable Reports
  const reportGen = new ReportGenerator(defaultConfig.reportsOutputPath);
  reportGen.generate(context);

  if (!healthy) {
    logger.error('💥 CI/CD Pipeline Failed: Health thresholds were not met.');
    process.exit(1);
  }

  logger.info('🎉 All stages complete and platform is healthy!');
  process.exit(0);
}

main().catch(err => {
  console.error('QA Platform runner crashed:', err);
  process.exit(1);
});
