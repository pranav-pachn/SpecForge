import { Agent } from './Agent';
import { PlannerAgent } from '@/agents/PlannerAgent';
import { ClarifierAgent } from '@/agents/ClarifierAgent';
import { SpecificationAgent } from '@/agents/SpecificationAgent';
import { ArchitectAgent } from '@/agents/ArchitectAgent';
import { TaskPlannerAgent } from '@/agents/TaskPlannerAgent';
import { ReviewerAgent } from '@/agents/ReviewerAgent';
import { ValidatorAgent } from '@/agents/ValidatorAgent';

export interface PipelineDefinition {
  name: string;
  steps: Agent<any>[];
}

export const StandardPipeline: PipelineDefinition = {
  name: "Standard",
  steps: [
    new PlannerAgent(),
    new ClarifierAgent(),
    new SpecificationAgent(),
    new ArchitectAgent(),
    new TaskPlannerAgent(),
    new ReviewerAgent(),
    new ValidatorAgent()
  ]
};
