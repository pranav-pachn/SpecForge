import crypto from "crypto";

export interface CacheProvider {
  get(key: string): any;
  set(key: string, value: any, ttlMs: number): void;
  delete(key: string): void;
  clear(): void;
}

class MemoryCache implements CacheProvider {
  private store = new Map<string, { value: any; expiry: number }>();

  get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: any, ttlMs: number) {
    this.store.set(key, { value, expiry: Date.now() + ttlMs });
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

// Single instance for MVP. Can be swapped for RedisCache later.
export const gatewayCache = new MemoryCache();

export function generateCacheKey(capability: string, system: string, prompt: string): string {
  return crypto.createHash("sha256").update(`${capability}:${system}:${prompt}`).digest("hex");
}
