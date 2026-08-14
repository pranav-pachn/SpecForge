export interface MetricData {
  stage: string;
  metric: string;
  value: number;
  unit: 'ms' | 'mb' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp: Date;
}

export class MetricsRegistry {
  private metrics: MetricData[] = [];

  record(stage: string, metric: string, value: number, unit: MetricData['unit'], tags?: Record<string, string>) {
    this.metrics.push({
      stage,
      metric,
      value,
      unit,
      tags,
      timestamp: new Date()
    });
  }

  getMetrics(): MetricData[] {
    return this.metrics;
  }

  getMetricsByStage(stage: string): MetricData[] {
    return this.metrics.filter(m => m.stage === stage);
  }

  getMetricsByName(metric: string): MetricData[] {
    return this.metrics.filter(m => m.metric === metric);
  }

  clear() {
    this.metrics = [];
  }
}
