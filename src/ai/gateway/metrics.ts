export interface MetricEvent {
  requestId: string;
  capability: string;
  provider: string;
  model: string;
  latency: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  cacheHit: boolean;
  retryCount: number;
  fallbackUsed: boolean;
  timestamp: Date;
  error?: string;
}

class MetricsCollector {
  private events: MetricEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  record(event: MetricEvent) {
    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.pop();
    }
    // Simple console log for MVP observation
    console.log(`[Gateway] ${event.capability} -> ${event.provider}:${event.model} | ${event.latency}ms | Cache: ${event.cacheHit} | Retries: ${event.retryCount} | Fallback: ${event.fallbackUsed}`);
  }

  getEvents() {
    return this.events;
  }
}

export const gatewayMetrics = new MetricsCollector();
