import { ExecutionContext } from './ExecutionContext';
import { AgentRequest } from '../interfaces/AgentRequest';
import { WorkflowContext } from '../../workflow/engine/WorkflowContext';

/**
 * Temporarily bridges the new runtime context back to the old WorkflowContext
 * so existing agents can run without rewriting their entire bodies.
 */
export class ExecutionContextAdapter {
  static toWorkflowContext(request: AgentRequest, context: ExecutionContext): WorkflowContext {
    return {
      input: {
        workflowId: request.workflowId,
        userId: request.userId,
        rawIdea: request.payload?.rawIdea || '',
        ...request.payload
      },
      artifacts: context.artifacts,
      execution: {
        startedAt: new Date(),
        stages: [] // Agent body shouldn't mutate this anyway in the new design
      }
    };
  }
}
