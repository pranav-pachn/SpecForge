import { WorkflowContext } from './WorkflowContext';

export interface Agent<TOutput> {
  readonly capability: string;
  readonly name: string;
  execute(ctx: WorkflowContext): Promise<TOutput>;
}
