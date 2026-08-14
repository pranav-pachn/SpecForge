export interface KeyHealth {
  key: string;
  failures: number;
  rateLimits: number;
  disabledUntil: Date | null;
  lastSuccess: Date | null;
}

export class KeyManager {
  private keysByProvider = new Map<string, KeyHealth[]>();

  registerKeys(providerId: string, keys: string[]) {
    const healthRecords = keys.map(key => ({
      key,
      failures: 0,
      rateLimits: 0,
      disabledUntil: null,
      lastSuccess: null
    }));
    this.keysByProvider.set(providerId, healthRecords);
  }

  getHealthyKey(providerId: string): string | null {
    const records = this.keysByProvider.get(providerId);
    if (!records || records.length === 0) return null;

    const now = new Date();
    
    // 1. Filter healthy keys
    const healthy = records.filter(r => !r.disabledUntil || r.disabledUntil < now);
    
    if (healthy.length === 0) return null;

    // 2. Simple random selection among healthy keys for load balancing
    const selected = healthy[Math.floor(Math.random() * healthy.length)];
    return selected.key;
  }

  recordSuccess(providerId: string, key: string) {
    const record = this.getRecord(providerId, key);
    if (record) {
      record.failures = 0;
      record.rateLimits = 0;
      record.disabledUntil = null;
      record.lastSuccess = new Date();
    }
  }

  recordFailure(providerId: string, key: string, isRateLimit: boolean) {
    const record = this.getRecord(providerId, key);
    if (record) {
      if (isRateLimit) {
        record.rateLimits++;
        // Disable for 1 minute on rate limit
        record.disabledUntil = new Date(Date.now() + 60 * 1000); 
      } else {
        record.failures++;
        if (record.failures >= 3) {
          // Disable for 5 minutes after 3 consecutive failures
          record.disabledUntil = new Date(Date.now() + 5 * 60 * 1000);
        }
      }
    }
  }

  private getRecord(providerId: string, key: string): KeyHealth | undefined {
    return this.keysByProvider.get(providerId)?.find(r => r.key === key);
  }
}

export const keyManager = new KeyManager();
