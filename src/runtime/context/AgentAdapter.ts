import { Agent as NewAgent } from '../interfaces/Agent';
import { Agent as OldAgent } from '../../workflow/engine/Agent';
import { AgentRequest } from '../interfaces/AgentRequest';
import { AgentResult } from '../interfaces/AgentResult';
import { ExecutionContext } from './ExecutionContext';
import { ExecutionContextAdapter } from './ExecutionContextAdapter';
import { AgentCapability } from '../interfaces/AgentCapability';

/**
 * Wraps an old Agent implementation so it can run inside the new AgentRuntime.
 */
export class AgentAdapter implements NewAgent {
  public id: string;
  public name: string;
  public capabilities: AgentCapability[];

  constructor(private oldAgent: OldAgent<any>) {
    this.id = oldAgent.capability; // Old agents used capability as their ID
    this.name = oldAgent.name;
    this.capabilities = ['AI_GENERATION']; // Assume all legacy agents do AI generation
  }

  async execute(request: AgentRequest, context: ExecutionContext): Promise<AgentResult> {
    // 1. Convert new context to old context
    const oldContext = ExecutionContextAdapter.toWorkflowContext(request, context);
    
    // 2. Execute old agent
    const output = await this.oldAgent.execute(oldContext);
    
    // 3. Mutate context.artifacts exactly how the old WorkflowEngine did
    context.artifacts[this.id] = output;

    // 4. Return new result format
    return {
      output
    };
  }
}
