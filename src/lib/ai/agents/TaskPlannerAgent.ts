import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { TaskPlannerOutput, TaskPlannerOutputSchema } from '../schemas/taskPlannerSchema';
import { PromptRegistry } from '../prompts/registry';

import { ContextBuilder } from '../../knowledge/ContextBuilder';
import { TaskContext } from '../../knowledge/profiles/TaskContext';

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
${ctx.artifacts.specification?.markdown}

### Architecture
${JSON.stringify(ctx.artifacts.architecture, null, 2)}
`;
    
    const augmentedSystem = PromptRegistry.tasks() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: TaskPlannerOutputSchema,
    });
    
    return object;
  }
}
