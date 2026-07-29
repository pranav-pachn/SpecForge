import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { ValidatorOutput, ValidatorOutputSchema } from '../schemas/validatorSchema';
import { PromptRegistry } from '../prompts/registry';

import { ContextBuilder } from '../../knowledge/ContextBuilder';
import { ValidationContext } from '../../knowledge/profiles/ValidationContext';

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
${ctx.artifacts.specification?.markdown}

### Tasks
${JSON.stringify(ctx.artifacts.tasks, null, 2)}
`;
    
    const augmentedSystem = PromptRegistry.validation() + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: ValidatorOutputSchema,
    });
    
    return object;
  }
}
