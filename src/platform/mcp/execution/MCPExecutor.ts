import { MCPMiddleware, NextMCPFunction } from "./MCPMiddleware";
import { MCPContext } from "../interfaces/MCPContext";
import { MCPResponse } from "../interfaces/MCPResponse";
import { connectorHealthMonitor } from "../health/ConnectorHealthMonitor";

export class MCPExecutor implements MCPMiddleware {
  async handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse> {
    if (!context.connector) {
      throw new Error("No connector assigned for execution");
    }

    const start = Date.now();
    try {
      let response: MCPResponse;

      if (context.request.callerType === "CONTEXT") {
        const items = await context.connector.search(context.request);
        response = {
          connectorId: context.connector.id,
          capability: context.request.capability,
          result: items,
          latencyMs: Date.now() - start,
          retryCount: context.retryCount,
          cached: false
        };
      } else {
        response = await context.connector.execute(context.request);
        response.latencyMs = Date.now() - start;
        response.retryCount = context.retryCount;
      }

      connectorHealthMonitor.recordSuccess(context.connector.id, response.latencyMs);
      return response;

    } catch (error) {
      connectorHealthMonitor.recordFailure(context.connector.id);
      throw error;
    }
  }
}
