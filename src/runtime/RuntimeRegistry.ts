import { Agent } from './interfaces/Agent';
import { AgentMetadata } from './interfaces/AgentMetadata';

export class RuntimeRegistry {
  private static instance: RuntimeRegistry;
  private agents: Map<string, Agent> = new Map();
  private metadata: Map<string, AgentMetadata> = new Map();

  private constructor() {}

  static getInstance(): RuntimeRegistry {
    if (!RuntimeRegistry.instance) {
      RuntimeRegistry.instance = new RuntimeRegistry();
    }
    return RuntimeRegistry.instance;
  }

  register(agent: Agent, metadata?: Partial<AgentMetadata>): void {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered.`);
    }

    this.agents.set(agent.id, agent);

    const fullMetadata: AgentMetadata = {
      id: agent.id,
      name: metadata?.name || agent.name,
      version: metadata?.version || '1.0.0',
      capabilities: agent.capabilities,
      description: metadata?.description,
      dependencies: metadata?.dependencies || []
    };
    
    this.metadata.set(agent.id, fullMetadata);
    console.log(`[RuntimeRegistry] Registered agent: ${agent.id} (v${fullMetadata.version})`);
  }

  getAgent(id: string): Agent {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error(`Agent not found in registry: ${id}`);
    }
    return agent;
  }

  getMetadata(id: string): AgentMetadata {
    const meta = this.metadata.get(id);
    if (!meta) {
      throw new Error(`Metadata not found for agent: ${id}`);
    }
    return meta;
  }
}
