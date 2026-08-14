import { Agent } from '@/workflow/engine/Agent';
import { WorkflowContext } from '@/workflow/engine/WorkflowContext';
import { gateway } from '@/ai/gateway/gateway';
import { ValidatorOutput, ValidatorOutputSchema } from '@/ai/schemas/validatorSchema';
import { PromptRegistry } from '@/ai/prompts/registry';

import { ContextBuilder } from '@/context/knowledge/ContextBuilder';
import { ValidationContext } from '@/context/knowledge/profiles/ValidationContext';

export class ValidatorAgent implements Agent<ValidatorOutput> {
  capability = 'validation';
  name = 'Validation';

  async execute(ctx: WorkflowContext): Promise<ValidatorOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new ValidationContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Explain any discrepancies or issues found during deterministic validation.

### Specification
${ctx.artifacts.spec?.markdown}

### Tasks
${JSON.stringify(ctx.artifacts.tasks, null, 2)}
`;
    
    const augmentedSystem = await PromptRegistry.validation() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: ValidatorOutputSchema,
    });
    
    return object;
  }
}
