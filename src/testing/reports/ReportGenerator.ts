import fs from 'fs';
import path from 'path';
import { PlatformTestContext } from '../core/PlatformTestContext';
import { MetricsRegistry } from '../metrics/MetricsRegistry';

export class ReportGenerator {
  private outputDir: string;

  constructor(baseDir: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.outputDir = path.join(baseDir, timestamp);
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  generate(context: PlatformTestContext) {
    context.logger.info(`[ReportGenerator] Writing artifacts to ${this.outputDir}`);

    const metricsData = context.metrics.getMetrics();
    
    // 1. Write metrics.json
    fs.writeFileSync(
      path.join(this.outputDir, 'metrics.json'),
      JSON.stringify(metricsData, null, 2)
    );

    // 2. Write performance-report.json
    const reportJson = {
      timestamp: new Date().toISOString(),
      runId: context.id,
      config: context.config,
      totalMetrics: metricsData.length,
      // Aggregates would be generated here
    };
    fs.writeFileSync(
      path.join(this.outputDir, 'performance-report.json'),
      JSON.stringify(reportJson, null, 2)
    );

    // 2.5 Write execution-trace.json
    fs.writeFileSync(
      path.join(this.outputDir, 'execution-trace.json'),
      JSON.stringify(context.traces.getTraces(), null, 2)
    );

    // 3. Write performance-report.html
    const html = `
    <html>
      <head>
        <title>SpecForge QA Platform Report</title>
        <style>body { font-family: sans-serif; padding: 2rem; }</style>
      </head>
      <body>
        <h1>SpecForge Platform Health Report</h1>
        <p>Run ID: ${context.id}</p>
        <p>Generated: ${new Date().toISOString()}</p>
        <h2>Metrics Recorded: ${metricsData.length}</h2>
      </body>
    </html>
    `;
    fs.writeFileSync(path.join(this.outputDir, 'performance-report.html'), html);

    context.logger.info('[ReportGenerator] Reports successfully generated.');
  }
}
