import { MCPCapability } from "../interfaces/MCPCapability";
import { MCPConnector } from "../interfaces/MCPConnector";
import { connectorRegistry } from "../registry/ConnectorRegistry";
import { connectorHealthMonitor } from "../health/ConnectorHealthMonitor";

export class MCPRouter {
  /**
   * Routes a capability to the best available connector.
   * Resolves based on health, availability, and simple precedence rules.
   */
  async route(capability: MCPCapability): Promise<MCPConnector | null> {
    const candidates = connectorRegistry.getByCapability(capability);
    
    if (candidates.length === 0) {
      return null;
    }

    // Filter healthy
    const healthyCandidates = candidates.filter(c => {
      const stats = connectorHealthMonitor.getStats(c.id);
      return stats.isAvailable;
    });

    if (healthyCandidates.length === 0) {
      console.warn(`[MCPRouter] No healthy connector found for ${capability}. Candidates:`, candidates.map(c => c.id));
      return null;
    }

    // In a sophisticated system, we might prefer local Filesystem over GitHub for READ_FILE.
    // For now, if 'filesystem' supports it, prioritize it for certain operations.
    const filesystemPref = healthyCandidates.find(c => c.id === 'filesystem');
    if (filesystemPref && ['READ_FILE', 'SEARCH_FILES'].includes(capability as string)) {
      return filesystemPref;
    }

    // Default to the first healthy
    return healthyCandidates[0];
  }
}

export const mcpRouter = new MCPRouter();
