export interface HealthStats {
  totalRequests: number;
  failures: number;
  rateLimits: number;
  totalLatencyMs: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  circuitOpenUntil: Date | null;
}

export class ProviderHealthMonitor {
  private statsByProvider = new Map<string, HealthStats>();

  private getStats(providerId: string): HealthStats {
    if (!this.statsByProvider.has(providerId)) {
      this.statsByProvider.set(providerId, {
        totalRequests: 0,
        failures: 0,
        rateLimits: 0,
        totalLatencyMs: 0,
        lastSuccess: null,
        lastFailure: null,
        circuitOpenUntil: null
      });
    }
    return this.statsByProvider.get(providerId)!;
  }

  isHealthy(providerId: string): boolean {
    const stats = this.getStats(providerId);
    if (stats.circuitOpenUntil && stats.circuitOpenUntil > new Date()) {
      return false;
    }
    return true;
  }

  recordSuccess(providerId: string, latencyMs: number) {
    const stats = this.getStats(providerId);
    stats.totalRequests++;
    stats.totalLatencyMs += latencyMs;
    stats.lastSuccess = new Date();
    // Close the circuit on success
    stats.circuitOpenUntil = null;
    stats.failures = 0;
  }

  recordFailure(providerId: string, isRateLimit: boolean) {
    const stats = this.getStats(providerId);
    stats.totalRequests++;
    stats.lastFailure = new Date();
    
    if (isRateLimit) {
      stats.rateLimits++;
      // Circuit breaker: open for 1 minute on rate limit
      stats.circuitOpenUntil = new Date(Date.now() + 60 * 1000);
    } else {
      stats.failures++;
      // Circuit breaker: open for 5 minutes after 5 consecutive failures
      if (stats.failures >= 5) {
        stats.circuitOpenUntil = new Date(Date.now() + 5 * 60 * 1000);
      }
    }
  }

  getAverageLatency(providerId: string): number {
    const stats = this.getStats(providerId);
    if (stats.totalRequests === 0) return 0;
    return stats.totalLatencyMs / stats.totalRequests;
  }

  getFailureRate(providerId: string): number {
    const stats = this.getStats(providerId);
    if (stats.totalRequests === 0) return 0;
    return (stats.failures + stats.rateLimits) / stats.totalRequests;
  }
}

export const providerHealthMonitor = new ProviderHealthMonitor();
