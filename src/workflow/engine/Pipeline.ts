import { PlannerAgent } from '@/agents/PlannerAgent';
import { ClarifierAgent } from '@/agents/ClarifierAgent';
import { SpecificationAgent } from '@/agents/SpecificationAgent';
import { ArchitectAgent } from '@/agents/ArchitectAgent';
import { TaskPlannerAgent } from '@/agents/TaskPlannerAgent';
import { ReviewerAgent } from '@/agents/ReviewerAgent';
import { ValidatorAgent } from '@/agents/ValidatorAgent';
import { RuntimeRegistry } from '@/runtime/RuntimeRegistry';
import { AgentAdapter } from '@/runtime/context/AgentAdapter';
import { SpecificationReviewAgent } from '@/agents/SpecificationReviewAgent';

export interface PipelineDefinition {
  name: string;
  steps: string[]; // Agent IDs instead of instances
}

export const StandardPipeline: PipelineDefinition = {
  name: "Standard",
  steps: [
    'planner',
    'clarifier',
    'specification',
    'architect',
    'task',
    'review',
    'validator'
  ]
};

export function registerStandardAgents(registry: RuntimeRegistry) {
  registry.register(new AgentAdapter(new PlannerAgent()), { dependencies: [] });
  registry.register(new AgentAdapter(new ClarifierAgent()), { dependencies: ['planner'] });
  registry.register(new AgentAdapter(new SpecificationAgent()), { dependencies: ['clarifier'] });
  registry.register(new AgentAdapter(new ArchitectAgent()), { dependencies: ['specification'] });
  registry.register(new AgentAdapter(new TaskPlannerAgent()), { dependencies: ['architect'] });
  registry.register(new AgentAdapter(new ReviewerAgent()), { dependencies: ['architect'] });
  registry.register(new AgentAdapter(new ValidatorAgent()), { dependencies: ['task', 'review'] });
  registry.register(new AgentAdapter(new SpecificationReviewAgent()), { dependencies: ['specification'] });
}
