import { MCPMiddleware, NextMCPFunction } from "./MCPMiddleware";
import { MCPContext } from "../interfaces/MCPContext";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";
import { MCPResponse } from "../interfaces/MCPResponse";

export class LoggingMiddleware implements MCPMiddleware {
  async handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse> {
    await PlatformEventBus.publish({
      id: crypto.randomUUID(),
      type: "MCPRequestStarted" as any,
      occurredAt: new Date(),
      version: 1,
      source: "MCPBroker",
      workflowId: context.request.workflowId,
      correlationId: context.request.correlationId,
      payload: {
        capability: context.request.capability,
        connectorId: context.connector?.id
      }
    });

    try {
      const response = await next(context);
      
      await PlatformEventBus.publish({
        id: crypto.randomUUID(),
        type: "MCPRequestCompleted" as any,
        occurredAt: new Date(),
        version: 1,
        source: "MCPBroker",
        workflowId: context.request.workflowId,
        correlationId: context.request.correlationId,
        payload: {
          capability: context.request.capability,
          connectorId: context.connector?.id,
          latencyMs: response.latencyMs,
          cached: response.cached
        }
      });

      return response;
    } catch (error: any) {
      await PlatformEventBus.publish({
        id: crypto.randomUUID(),
        type: "MCPRequestFailed" as any,
        occurredAt: new Date(),
        version: 1,
        source: "MCPBroker",
        workflowId: context.request.workflowId,
        correlationId: context.request.correlationId,
        payload: {
          capability: context.request.capability,
          connectorId: context.connector?.id,
          error: error.message
        }
      });
      throw error;
    }
  }
}
