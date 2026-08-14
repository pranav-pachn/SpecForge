import { RetrievedContext } from "../interfaces/RetrievedContext";
import { ContextRequest } from "../interfaces/ContextRequest";
import crypto from "crypto";

export class ContextCache {
  // Simple in-memory cache for demonstration.
  // A production system would use Redis to share this across worker nodes.
  private cache = new Map<string, { data: RetrievedContext; expiresAt: number }>();
  private readonly TTL_MS = 1000 * 60 * 5; // 5 minutes

  /**
   * Generates a stable hash key for a request.
   */
  private generateKey(request: ContextRequest): string {
    const data = `${request.workflowId}:${request.capability}:${request.query}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  get(request: ContextRequest): RetrievedContext | undefined {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);
    
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }

    if (entry) {
      this.cache.delete(key);
    }
    
    return undefined;
  }

  set(request: ContextRequest, context: RetrievedContext): void {
    const key = this.generateKey(request);
    this.cache.set(key, {
      data: context,
      expiresAt: Date.now() + this.TTL_MS
    });
  }
}

export const contextCache = new ContextCache();
