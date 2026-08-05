export interface AgentRequest<TInput = any> {
  workflowId: string;
  userId: string;
  payload: TInput;
}
