import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { ReviewerOutput, ReviewerOutputSchema } from '@/ai/schemas/reviewerSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

import { ContextBuilder } from '@/context/knowledge/ContextBuilder';
import { ReviewContext } from '@/context/knowledge/profiles/ReviewContext';

export class ReviewerAgent implements Agent<ReviewerOutput> {
  capability = 'review';
  name = 'Engineering Review';

  async execute(ctx: WorkflowContext): Promise<ReviewerOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new ReviewContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Perform a full engineering review of the planned tasks, architecture, and specification.

### Specification
${ctx.artifacts.specification?.markdown}

### Architecture
${JSON.stringify(ctx.artifacts.architecture, null, 2)}

### Tasks
${JSON.stringify(ctx.artifacts.tasks, null, 2)}
`;
    
    const augmentedSystem = PromptRegistry.engineeringReview() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: ReviewerOutputSchema,
    });
    
    return object;
  }
}
