import { CLARIFICATION_SYSTEM_PROMPT } from "./clarification-prompts";
import { DRIFT_DIFF_PROMPT } from "./drift-prompts";
import { ENGINEERING_REVIEW_SYSTEM_PROMPT } from "./engineering-review-prompts";
import { EXECUTION_PACK_SYSTEM_PROMPT } from "./execution-prompts";
import { PLAN_GENERATION_SYSTEM_PROMPT } from "./plan-prompts";
import { SPEC_GENERATION_SYSTEM_PROMPT } from "./spec-prompts";
import { FULL_REVIEW_SYSTEM_PROMPT } from "./review-prompts";
import { SPEC_REGENERATE_SYSTEM_PROMPT } from "./spec-regenerate-prompts";
import { TASK_DECOMPOSITION_SYSTEM_PROMPT } from "./task-prompts";
import { VALIDATION_MISSING_FEATURES_PROMPT } from "./validation-prompts";
import { VALIDATION_REMEDIATION_PROMPT } from "./validation-remediation-prompts";

export const PromptRegistry = {
  spec: () => SPEC_GENERATION_SYSTEM_PROMPT,
  specRegenerate: () => SPEC_REGENERATE_SYSTEM_PROMPT,
  plan: () => PLAN_GENERATION_SYSTEM_PROMPT,
  tasks: () => TASK_DECOMPOSITION_SYSTEM_PROMPT,
  review: () => FULL_REVIEW_SYSTEM_PROMPT,
  validation: () => VALIDATION_MISSING_FEATURES_PROMPT,
  drift: () => DRIFT_DIFF_PROMPT,
  execution: () => EXECUTION_PACK_SYSTEM_PROMPT,
  clarify: () => CLARIFICATION_SYSTEM_PROMPT,
  autoFix: () => VALIDATION_REMEDIATION_PROMPT,
  engineeringReview: () => ENGINEERING_REVIEW_SYSTEM_PROMPT,
} as const;
