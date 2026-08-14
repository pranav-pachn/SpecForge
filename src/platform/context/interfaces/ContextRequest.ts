export interface ContextRequest {
  capability: string;
  workflowId: string;
  projectId?: string;
  query: string;
  metadata?: Record<string, unknown>;
}
