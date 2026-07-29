import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { PlannerOutput, PlannerOutputSchema } from '../schemas/plannerSchema';
import { PromptRegistry } from '../prompts/registry';

import { ContextBuilder } from '../../knowledge/ContextBuilder';
import { PlanningContext } from '../../knowledge/profiles/PlanningContext';

export class PlannerAgent implements Agent<PlannerOutput> {
  capability = 'planning';
  name = 'Planning';

  async execute(ctx: WorkflowContext): Promise<PlannerOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new PlanningContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Create an implementation plan for the following raw idea. 
Be sure to fill out the traceability fields to explain why each feature is necessary.

### Idea
${ctx.input.rawIdea}
`;
    
    const augmentedSystem = PromptRegistry.plan() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: PlannerOutputSchema,
    });
    
    return object;
  }
}
