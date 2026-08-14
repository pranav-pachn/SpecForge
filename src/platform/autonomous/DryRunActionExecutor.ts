import { ExecutionAction, ActionResult } from "./interfaces/ExecutionAction";

export class DryRunActionExecutor {
  /**
   * Simulates the execution of an action and logs what would have happened.
   * Returns a mock successful ActionResult.
   */
  static async execute(action: ExecutionAction, workspacePath: string): Promise<ActionResult> {
    const startTime = Date.now();
    let output = "";
    
    switch (action.type) {
      case "READ_FILE":
        output = `Would read file: ${action.parameters.path}`;
        break;
      case "PATCH_FILE":
        output = `Would patch file: ${action.parameters.path}\nPatch: ${action.parameters.patch.substring(0, 50)}...`;
        break;
      case "RUN_COMMAND":
        output = `Would run command: ${action.parameters.command} ${action.parameters.args?.join(" ")}`;
        break;
      case "WRITE_FILE":
        output = `Would write to file: ${action.parameters.path}`;
        break;
      case "DELETE_FILE":
        output = `Would delete file: ${action.parameters.path}`;
        break;
      case "COMMIT":
        output = `Would commit changes: ${action.parameters.message}`;
        break;
      default:
        output = `Would execute action: ${action.type}`;
        break;
    }

    console.log(`[DryRunExecutor] ${output}`);

    return {
      success: true,
      output,
      durationMs: Date.now() - startTime
    };
  }
}
