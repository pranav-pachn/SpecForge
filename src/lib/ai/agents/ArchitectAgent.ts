import { Agent } from '../engine/Agent';
import { WorkflowContext } from '../engine/WorkflowContext';
import { gateway } from '../gateway/gateway';
import { ArchitectOutput, ArchitectOutputSchema } from '../schemas/architectSchema';

export const ARCHITECT_SYSTEM_PROMPT = `
You are a Principal Software Architect.

Your goal is to take a detailed software specification and design
a complete technical architecture for the system described.

Produce:
1. modules[]      — logical modules and their responsibilities
2. services[]     — services, their types (API, worker, job, etc.) and tech stack
3. entities[]     — data models with fields and relationships
4. apis[]         — API contracts (method, path, request/response summary)
5. database       — tables, key indexes, migration notes
6. externalIntegrations[] — third-party APIs or services required
7. architectureDiagram    — a valid Mermaid flowchart string

Focus on practical, buildable architectures.
Do not over-engineer. Use the spec's stated constraints.
`;

import { ContextBuilder } from '../../knowledge/ContextBuilder';
import { ArchitectContext } from '../../knowledge/profiles/ArchitectContext';

export class ArchitectAgent implements Agent<ArchitectOutput> {
  capability = 'architect';
  name = 'Architecture';

  async execute(ctx: WorkflowContext): Promise<ArchitectOutput> {
    const engineeringMemory = await ContextBuilder.build({
      profile: new ArchitectContext(),
      workflowId: ctx.input.workflowId,
      query: ctx.input.rawIdea
    });

    const prompt = `
Please design the system architecture based on this specification:

### Specification
${ctx.artifacts.specification?.markdown}
`;
    
    const augmentedSystem = ARCHITECT_SYSTEM_PROMPT + '\n\n' + engineeringMemory;

    const { object } = await gateway.executeObject({
      capability: this.capability as any,
      system: augmentedSystem,
      prompt,
      schema: ArchitectOutputSchema,
    });
    
    return object;
  }
}
