import { MCPCapability } from "./MCPCapability";

export interface MCPRequest {
  id: string;           // Trace ID
  capability: MCPCapability;
  query?: string;       // Natural language or structured input
  params?: Record<string, unknown>;
  workflowId?: string;
  correlationId?: string;
  callerType: "CONTEXT" | "AGENT" | "PLAYGROUND";
}
