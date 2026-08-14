import { MCPRequest } from "./MCPRequest";
import { MCPResponse } from "./MCPResponse";
import { MCPConnector } from "./MCPConnector";

export interface MCPContext {
  request: MCPRequest;
  connector?: MCPConnector;
  permissions: string[];    // ["READ", "WRITE", "EXECUTE"]
  cache?: MCPResponse;
  metadata: Record<string, unknown>;
  traceId: string;
  retryCount: number;
  startedAt: Date;
}
