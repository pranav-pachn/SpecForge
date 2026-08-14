import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { TaskPlannerOutput, TaskPlannerOutputSchema } from '@/ai/schemas/taskPlannerSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

import { ContextBuilder } from '@/context/knowledge/ContextBuilder';
import { TaskContext } from '@/context/knowledge/profiles/TaskContext';

export class TaskPlannerAgent implements Agent<TaskPlannerOutput> {
  capability = 'tasks';
  name = 'Task Planning';

  async execute(ctx: WorkflowContext): Promise<TaskPlannerOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new TaskContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Create a list of executable tasks based on the specification and architecture.

### Specification
${ctx.artifacts.spec?.markdown}

### Architecture
${JSON.stringify(ctx.artifacts.architect, null, 2)}
`;
    
    const augmentedSystem = await PromptRegistry.tasks() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: TaskPlannerOutputSchema,
    });
    
    return object;
  }
}
