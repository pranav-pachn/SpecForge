import { MCPMiddleware, NextMCPFunction } from "./MCPMiddleware";
import { MCPContext } from "../interfaces/MCPContext";
import { MCPResponse } from "../interfaces/MCPResponse";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";
import { connectorHealthMonitor } from "../health/ConnectorHealthMonitor";

export class RetryMiddleware implements MCPMiddleware {
  private readonly MAX_RETRIES = 3;

  async handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.MAX_RETRIES) {
      try {
        if (attempt > 0) {
          context.retryCount = attempt;
          if (context.connector) {
            connectorHealthMonitor.recordRetry(context.connector.id);
          }
          await PlatformEventBus.publish({
            id: crypto.randomUUID(),
            type: "MCPRetryStarted" as any,
            occurredAt: new Date(),
            version: 1,
            source: "MCPBroker",
            workflowId: context.request.workflowId,
            payload: { attempt, capability: context.request.capability }
          });
          // Exponential backoff
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 200));
        }

        return await next(context);
      } catch (error: any) {
        lastError = error;
        attempt++;
        
        // If it's a permission or validation error, don't retry
        if (error.message.includes("[Permission Denied]") || error.name === "ValidationError") {
          throw error;
        }
      }
    }

    throw lastError;
  }
}
