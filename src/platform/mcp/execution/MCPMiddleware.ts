import { MCPContext } from "../interfaces/MCPContext";
import { MCPResponse } from "../interfaces/MCPResponse";

export type NextMCPFunction = (context: MCPContext) => Promise<MCPResponse>;

export interface MCPMiddleware {
  handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse>;
}
