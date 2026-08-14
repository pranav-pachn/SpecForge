import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { ClarifierOutput, ClarifierOutputSchema } from '@/ai/schemas/clarifierSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

export class ClarifierAgent implements Agent<ClarifierOutput> {
  capability = 'clarify';
  name = 'Clarifying';

  async execute(ctx: WorkflowContext): Promise<ClarifierOutput> {
    const prompt = `
Review the implementation plan and identify missing assumptions or clarifying questions.

### Idea
${ctx.input.rawIdea}

### Plan
${JSON.stringify(ctx.artifacts.planning, null, 2)}
`;
    
    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: await PromptRegistry.clarify(),
      prompt,
      schema: ClarifierOutputSchema,
    });
    
    return object;
  }
}
