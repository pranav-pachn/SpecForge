import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { ClarifierOutput, ClarifierOutputSchema } from '../schemas/clarifierSchema';
import { PromptRegistry } from '../prompts/registry';

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
      system: PromptRegistry.clarify(),
      prompt,
      schema: ClarifierOutputSchema,
    });
    
    return object;
  }
}
