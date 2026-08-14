import { MCPMiddleware, NextMCPFunction } from "./MCPMiddleware";
import { MCPContext } from "../interfaces/MCPContext";
import { MCPResponse } from "../interfaces/MCPResponse";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";

export class CacheMiddleware implements MCPMiddleware {
  // Simple in-memory cache. In production, this would be Redis.
  private cache = new Map<string, { response: MCPResponse, expiresAt: number }>();
  private readonly TTL_MS = 60000; // 1 minute

  async handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse> {
    // Only cache read-like operations
    const cap = context.request.capability as string;
    if (cap.startsWith("SEARCH") || cap.startsWith("READ") || cap.startsWith("LIST") || cap.startsWith("GET")) {
      const key = this.generateKey(context);
      const cached = this.cache.get(key);

      if (cached && cached.expiresAt > Date.now()) {
        await PlatformEventBus.publish({
          id: crypto.randomUUID(),
          type: "MCPCacheHit" as any,
          occurredAt: new Date(),
          version: 1,
          source: "MCPBroker",
          workflowId: context.request.workflowId,
          payload: { capability: context.request.capability }
        });
        return { ...cached.response, cached: true };
      }
      
      await PlatformEventBus.publish({
        id: crypto.randomUUID(),
        type: "MCPCacheMiss" as any,
        occurredAt: new Date(),
        version: 1,
        source: "MCPBroker",
        workflowId: context.request.workflowId,
        payload: { capability: context.request.capability }
      });

      const response = await next(context);
      this.cache.set(key, { response, expiresAt: Date.now() + this.TTL_MS });
      return response;
    }

    return next(context);
  }

  private generateKey(context: MCPContext): string {
    return `${context.request.capability}:${JSON.stringify(context.request.params || {})}:${context.request.query || ""}`;
  }
}
