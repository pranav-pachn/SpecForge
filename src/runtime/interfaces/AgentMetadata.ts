import { AgentCapability } from './AgentCapability';

export interface AgentMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities: AgentCapability[];
  dependencies?: string[]; // other agent IDs this agent depends on
  requiresApproval?: boolean;
}
