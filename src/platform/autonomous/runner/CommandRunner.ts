import { execSync } from "child_process";
import { ActionResult } from "../interfaces/ExecutionAction";

export class CommandRunner {
  /**
   * Executes a command in an isolated workspace.
   */
  static async run(command: string, args: string[] = [], workspacePath: string): Promise<ActionResult> {
    const startTime = Date.now();
    try {
      const fullCommand = args.length > 0 ? `${command} ${args.join(" ")}` : command;
      
      const output = execSync(fullCommand, { 
        cwd: workspacePath,
        encoding: "utf-8",
        stdio: "pipe" 
      });

      return {
        success: true,
        output: output.trim(),
        durationMs: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout?.toString() || error.message,
        warnings: [error.stderr?.toString()],
        durationMs: Date.now() - startTime
      };
    }
  }
}
