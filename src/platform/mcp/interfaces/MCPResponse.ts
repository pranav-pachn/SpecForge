import { MCPCapability } from "./MCPCapability";

export interface MCPResponse {
  connectorId: string;
  capability: MCPCapability;
  result: unknown;      // Connector-specific result
  latencyMs: number;
  retryCount: number;
  cached: boolean;
}
