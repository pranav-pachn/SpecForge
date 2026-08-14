import { MCPMiddleware, NextMCPFunction } from "./MCPMiddleware";
import { MCPContext } from "../interfaces/MCPContext";
import { MCPResponse } from "../interfaces/MCPResponse";

export class PermissionMiddleware implements MCPMiddleware {
  async handle(context: MCPContext, next: NextMCPFunction): Promise<MCPResponse> {
    if (!context.connector) {
      throw new Error("No connector assigned for this request.");
    }

    // In a real system, you'd verify if context.permissions (what the caller has)
    // intersects with context.connector.permissions (what the tool requires).
    // For now, if the tool requires WRITE, the caller must have WRITE.
    const requiredByTool = context.connector.permissions;
    const callerHas = context.permissions || ["READ"]; // Default to READ if not specified

    for (const req of requiredByTool) {
      if (req === "WRITE" || req === "DELETE" || req === "EXECUTE") {
        if (!callerHas.includes(req) && !callerHas.includes("*")) {
          throw new Error(`[Permission Denied] Connector ${context.connector.id} requires ${req} but caller only has ${callerHas.join(', ')}`);
        }
      }
    }

    return next(context);
  }
}
