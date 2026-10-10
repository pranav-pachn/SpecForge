import type { PlannerOutput } from "@/ai/schemas/plannerSchema";
import type { ClarifierOutput } from "@/ai/schemas/clarifierSchema";
import type { SpecificationOutput } from "@/ai/schemas/specificationSchema";
import type { ArchitectOutput } from "@/ai/schemas/architectSchema";
import type { TaskPlannerOutput } from "@/ai/schemas/taskPlannerSchema";
import type { ReviewerOutput } from "@/ai/schemas/reviewerSchema";
import type { ValidatorOutput } from "@/ai/schemas/validatorSchema";

export interface StageRecord {
  agent: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  latencyMs?: number;
  error?: string;
}

/** Stored under the agent capability id, which is the key AgentAdapter writes. */
export interface SpecReviewArtifact {
  checks: Array<{
    type: "REQUIREMENT_COVERAGE" | "TEST_COVERAGE" | "ASSUMPTION_RISK" | "CONSISTENCY";
    status: "PASSED" | "FAILED";
    description: string;
  }>;
}

export interface PipelineArtifacts {
  planning?: PlannerOutput;
  clarify?: ClarifierOutput;
  spec?: SpecificationOutput;
  spec_review?: SpecReviewArtifact;
  architect?: ArchitectOutput;
  tasks?: TaskPlannerOutput;
  review?: ReviewerOutput;
  validation?: ValidatorOutput;
}

export interface WorkflowContext {
  input: {
    workflowId: string;
    userId: string;
    rawIdea: string;
    projectId?: string;
    [key: string]: unknown;
  };
  artifacts: PipelineArtifacts;
  execution: {
    startedAt: Date;
    stages: StageRecord[];
  };
}
