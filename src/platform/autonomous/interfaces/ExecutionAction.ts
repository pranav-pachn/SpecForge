export type ExecutionActionType = 
  | "READ_FILE" 
  | "WRITE_FILE" 
  | "PATCH_FILE" 
  | "CREATE_FILE" 
  | "DELETE_FILE" 
  | "SEARCH_CODE" 
  | "RUN_COMMAND" 
  | "RUN_TEST" 
  | "FORMAT" 
  | "LINT" 
  | "BUILD" 
  | "COMMIT" 
  | "BRANCH" 
  | "STASH" 
  | "ROLLBACK" 
  | "OPEN_PR";

export interface BaseAction {
  type: ExecutionActionType;
  description?: string;
  rollbackAction?: ExecutionAction;
}

export interface ReadFileAction extends BaseAction {
  type: "READ_FILE";
  parameters: { path: string };
}

export interface WriteFileAction extends BaseAction {
  type: "WRITE_FILE";
  parameters: { path: string; content: string };
}

export interface PatchFileAction extends BaseAction {
  type: "PATCH_FILE";
  parameters: { path: string; patch: string };
}

export interface CreateFileAction extends BaseAction {
  type: "CREATE_FILE";
  parameters: { path: string; content: string };
}

export interface DeleteFileAction extends BaseAction {
  type: "DELETE_FILE";
  parameters: { path: string };
}

export interface SearchCodeAction extends BaseAction {
  type: "SEARCH_CODE";
  parameters: { query: string; path?: string };
}

export interface RunCommandAction extends BaseAction {
  type: "RUN_COMMAND";
  parameters: { command: string; args?: string[]; cwd?: string };
}

export interface RunTestAction extends BaseAction {
  type: "RUN_TEST";
  parameters: { command: string; args?: string[] };
}

export interface FormatAction extends BaseAction {
  type: "FORMAT";
  parameters: { paths?: string[] };
}

export interface LintAction extends BaseAction {
  type: "LINT";
  parameters: { paths?: string[] };
}

export interface BuildAction extends BaseAction {
  type: "BUILD";
  parameters: {};
}

export interface CommitAction extends BaseAction {
  type: "COMMIT";
  parameters: { message: string };
}

export interface BranchAction extends BaseAction {
  type: "BRANCH";
  parameters: { branchName: string };
}

export interface StashAction extends BaseAction {
  type: "STASH";
  parameters: { message?: string };
}

export interface RollbackAction extends BaseAction {
  type: "ROLLBACK";
  parameters: {};
}

export interface OpenPRAction extends BaseAction {
  type: "OPEN_PR";
  parameters: { title: string; body: string; baseBranch: string; headBranch: string };
}

export type ExecutionAction = 
  | ReadFileAction 
  | WriteFileAction 
  | PatchFileAction 
  | CreateFileAction 
  | DeleteFileAction 
  | SearchCodeAction 
  | RunCommandAction 
  | RunTestAction 
  | FormatAction 
  | LintAction 
  | BuildAction 
  | CommitAction 
  | BranchAction 
  | StashAction 
  | RollbackAction 
  | OpenPRAction;

export interface ActionResult {
  success: boolean;
  output?: string;
  filesModified?: string[];
  warnings?: string[];
  durationMs: number;
}

export interface ExecutionPlan {
  mode: "AUTONOMOUS" | "ASSISTED";
  steps: ExecutionAction[];
}
