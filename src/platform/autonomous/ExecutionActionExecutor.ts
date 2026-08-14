import { ExecutionAction, ActionResult } from "./interfaces/ExecutionAction";
import { mcpBroker } from "../mcp/MCPBroker";
import { CommandRunner } from "./runner/CommandRunner";
import { gitService } from "./git/GitService";
import { MCPCapability } from "../mcp/interfaces/MCPCapability";

export class ExecutionActionExecutor {
  /**
   * Executes an action against the real workspace using the MCP Broker or GitService.
   */
  static async execute(action: ExecutionAction, workspacePath: string): Promise<ActionResult> {
    const startTime = Date.now();
    let output = "";
    
    try {
      switch (action.type) {
        case "READ_FILE":
        case "PATCH_FILE":
        case "WRITE_FILE":
        case "CREATE_FILE":
        case "DELETE_FILE":
          // Route through MCP Broker
          const response = await mcpBroker.execute({
            id: crypto.randomUUID(),
            capability: MCPCapability.WRITE_FILE, // We assume we register this capability
            params: {
              action: action.type,
              workspacePath,
              ...action.parameters
            },
            callerType: "AGENT"
          });
          output = response.result as string;
          break;

        case "RUN_COMMAND":
        case "RUN_TEST":
        case "FORMAT":
        case "LINT":
          return await CommandRunner.run(
            (action as any).parameters.command || "echo", 
            (action as any).parameters.args, 
            workspacePath
          );

        case "COMMIT":
          await gitService.commit(workspacePath, action.parameters.message);
          output = "Committed successfully";
          break;
          
        case "BRANCH":
          await gitService.branch(workspacePath, action.parameters.branchName);
          output = `Switched to branch ${action.parameters.branchName}`;
          break;

        case "ROLLBACK":
          await gitService.reset(workspacePath, true);
          output = "Rolled back successfully";
          break;

        default:
          output = `Simulated execution of ${action.type}`;
          break;
      }

      return {
        success: true,
        output,
        durationMs: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.message || "Unknown error",
        durationMs: Date.now() - startTime,
        warnings: ["Action failed"]
      };
    }
  }
}
