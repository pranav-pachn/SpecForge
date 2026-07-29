export type ProviderStatus = "HEALTHY" | "DEGRADED" | "RATE_LIMITED" | "DOWN";

export interface ProviderHealth {
  status: ProviderStatus;
  latencyMs: number;
  failureCount: number;
  rateLimitCount: number;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  recoveryTime: Date | null;
}

const DEFAULT_HEALTH: ProviderHealth = {
  status: "HEALTHY",
  latencyMs: 0,
  failureCount: 0,
  rateLimitCount: 0,
  lastSuccess: null,
  lastFailure: null,
  recoveryTime: null,
};

// Configurable thresholds
const MAX_FAILURES_BEFORE_DOWN = 3;
const RATE_LIMIT_RECOVERY_MS = 1000 * 60; // 1 minute penalty for rate limits
const DOWN_RECOVERY_MS = 1000 * 60 * 5; // 5 minute penalty for 500s

class ProviderHealthTracker {
  private healthData: Map<string, ProviderHealth> = new Map();

  getHealth(provider: string): ProviderHealth {
    if (!this.healthData.has(provider)) {
      this.healthData.set(provider, { ...DEFAULT_HEALTH });
    }
    const health = this.healthData.get(provider)!;
    
    // Check if recovery time has passed
    if (health.recoveryTime && new Date() > health.recoveryTime) {
      this.resetHealth(provider);
      return this.healthData.get(provider)!;
    }

    return health;
  }

  isHealthy(provider: string): boolean {
    const health = this.getHealth(provider);
    return health.status === "HEALTHY" || health.status === "DEGRADED";
  }

  recordSuccess(provider: string, latencyMs: number) {
    const health = this.getHealth(provider);
    health.status = "HEALTHY";
    health.failureCount = 0;
    health.rateLimitCount = 0;
    health.lastSuccess = new Date();
    health.recoveryTime = null;
    
    // Moving average for latency (alpha = 0.3)
    health.latencyMs = health.latencyMs === 0 
      ? latencyMs 
      : Math.floor((health.latencyMs * 0.7) + (latencyMs * 0.3));
      
    this.healthData.set(provider, health);
  }

  recordFailure(provider: string, error: any) {
    const health = this.getHealth(provider);
    health.lastFailure = new Date();
    
    // Check if it's a rate limit (429)
    const isRateLimit = error?.status === 429 || 
                        error?.message?.includes("rate limit") || 
                        error?.message?.includes("429");

    if (isRateLimit) {
      health.rateLimitCount++;
      health.status = "RATE_LIMITED";
      health.recoveryTime = new Date(Date.now() + RATE_LIMIT_RECOVERY_MS);
      console.warn(`[Gateway Health] ${provider} is RATE_LIMITED. Recovery at ${health.recoveryTime.toISOString()}`);
    } else {
      health.failureCount++;
      if (health.failureCount >= MAX_FAILURES_BEFORE_DOWN) {
        health.status = "DOWN";
        health.recoveryTime = new Date(Date.now() + DOWN_RECOVERY_MS);
        console.error(`[Gateway Health] ${provider} is DOWN. Recovery at ${health.recoveryTime.toISOString()}`);
      } else {
        health.status = "DEGRADED";
      }
    }

    this.healthData.set(provider, health);
  }

  resetHealth(provider: string) {
    this.healthData.set(provider, { ...DEFAULT_HEALTH });
  }

  getAllHealthStats(): Record<string, ProviderHealth> {
    const stats: Record<string, ProviderHealth> = {};
    Array.from(this.healthData.entries()).forEach(([provider, health]) => {
      stats[provider] = { ...health };
    });
    return stats;
  }
}

export const healthTracker = new ProviderHealthTracker();
