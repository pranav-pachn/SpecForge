import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { SpecificationOutput, SpecificationOutputSchema } from '../schemas/specificationSchema';
import { PromptRegistry } from '../prompts/registry';

import { ContextBuilder } from '../../knowledge/ContextBuilder';
import { SpecificationContext } from '../../knowledge/profiles/SpecificationContext';

export class SpecificationAgent implements Agent<SpecificationOutput> {
  capability = 'spec';
  name = 'Specification';

  async execute(ctx: WorkflowContext): Promise<SpecificationOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new SpecificationContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Create a detailed specification based on the plan and clarifications.

### Plan
${JSON.stringify(ctx.artifacts.planning, null, 2)}

### Clarifications
${JSON.stringify(ctx.artifacts.clarification, null, 2)}
`;
    
    const augmentedSystem = PromptRegistry.spec() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: SpecificationOutputSchema,
    });
    
    return object;
  }
}
