import {
  WorkflowStatus,
  ArtifactType,
  ArtifactVersionStatus,
  TaskStatus,
} from "@prisma/client";

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  DRAFT: "Draft",
  CLARIFYING: "Clarifying",
  SPEC_REVIEW: "Spec Review",
  PLANNING: "Planning",
  TASK_BREAKDOWN: "Task Breakdown",
  EXECUTING: "Executing",
  REVIEWING: "Reviewing",
  VALIDATING: "Validating",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const WORKFLOW_STATUS_COLORS: Record<WorkflowStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  CLARIFYING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  SPEC_REVIEW: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  PLANNING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TASK_BREAKDOWN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  EXECUTING: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  REVIEWING: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  VALIDATING: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  SPEC: "Specification",
  PLAN: "Implementation Plan",
  TASK_BREAKDOWN: "Task Breakdown",
  EXECUTION_PACK: "Execution Pack",
};

export const VERSION_STATUS_COLORS: Record<ArtifactVersionStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  NEEDS_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  STALE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  SUPERSEDED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  BLOCKED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export const WORKFLOW_PIPELINE_STAGES = [
  WorkflowStatus.DRAFT,
  WorkflowStatus.CLARIFYING,
  WorkflowStatus.SPEC_REVIEW,
  WorkflowStatus.PLANNING,
  WorkflowStatus.TASK_BREAKDOWN,
  WorkflowStatus.EXECUTING,
  WorkflowStatus.REVIEWING,
  WorkflowStatus.VALIDATING,
  WorkflowStatus.COMPLETED,
];
