export interface ConnectorHealthStats {
  latencyMs: number;
  failures: number;
  retries: number;
  totalRequests: number;
  isAvailable: boolean;
  lastChecked: Date;
}

export class ConnectorHealthMonitor {
  private stats = new Map<string, ConnectorHealthStats>();

  getStats(connectorId: string): ConnectorHealthStats {
    if (!this.stats.has(connectorId)) {
      this.stats.set(connectorId, {
        latencyMs: 0,
        failures: 0,
        retries: 0,
        totalRequests: 0,
        isAvailable: true,
        lastChecked: new Date()
      });
    }
    return this.stats.get(connectorId)!;
  }

  recordSuccess(connectorId: string, latencyMs: number) {
    const stats = this.getStats(connectorId);
    stats.totalRequests++;
    stats.latencyMs = Math.round((stats.latencyMs * 0.9) + (latencyMs * 0.1)); // EMA
    stats.isAvailable = true;
    stats.lastChecked = new Date();
  }

  recordFailure(connectorId: string) {
    const stats = this.getStats(connectorId);
    stats.totalRequests++;
    stats.failures++;
    // Simple circuit breaker logic could go here
    if (stats.failures > 5) {
      stats.isAvailable = false;
    }
    stats.lastChecked = new Date();
  }

  recordRetry(connectorId: string) {
    const stats = this.getStats(connectorId);
    stats.retries++;
  }
}

export const connectorHealthMonitor = new ConnectorHealthMonitor();
