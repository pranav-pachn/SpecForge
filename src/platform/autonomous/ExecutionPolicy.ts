import { ExecutionAction, ExecutionPlan } from "./interfaces/ExecutionAction";

export class ExecutionPolicy {
  /**
   * Evaluates an action against organizational and platform policies.
   * Throws an error if the action is forbidden.
   */
  static validate(action: ExecutionAction, plan: ExecutionPlan): void {
    switch (action.type) {
      case "DELETE_FILE":
        // DELETE requires ASSISTED mode or explicit override
        if (plan.mode === "AUTONOMOUS") {
          throw new Error(`[Policy Violation] DELETE_FILE action is forbidden in AUTONOMOUS mode without explicit approval.`);
        }
        break;

      case "RUN_COMMAND":
        const cmd = action.parameters.command.toLowerCase();
        // Allowlist for commands
        const allowed = ["npm run build", "npm test", "npm run lint", "npx prettier", "npm install"];
        const isAllowed = allowed.some((a) => cmd.startsWith(a));
        if (!isAllowed) {
          throw new Error(`[Policy Violation] RUN_COMMAND '${cmd}' is not in the allowlist.`);
        }
        break;

      case "OPEN_PR":
        // Ensure some organization rule is met. For Phase 15, we assume it's always allowed if GitService is configured.
        break;
        
      default:
        // Other actions (READ_FILE, PATCH_FILE, etc.) are permitted by default in an isolated workspace.
        break;
    }
  }

  /**
   * Validates the entire plan before execution starts.
   */
  static validatePlan(plan: ExecutionPlan): void {
    for (const action of plan.steps) {
      // Cast the action from JSON format to ExecutionAction interface format
      this.validate(action as unknown as ExecutionAction, plan);
    }
  }
}
