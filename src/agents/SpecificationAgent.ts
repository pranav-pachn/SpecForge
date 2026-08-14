import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { SpecificationOutput, SpecificationOutputSchema } from '@/ai/schemas/specificationSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

import { ContextBuilder } from '@/context/knowledge/ContextBuilder';
import { SpecificationContext } from '@/context/knowledge/profiles/SpecificationContext';

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
${JSON.stringify(ctx.artifacts.clarify, null, 2)}
`;
    
    const augmentedSystem = await PromptRegistry.spec() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: SpecificationOutputSchema,
    });
    
    return object;
  }
}
