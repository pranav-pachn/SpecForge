import { MCPConnector } from "../interfaces/MCPConnector";
import { MCPCapability } from "../interfaces/MCPCapability";

export class ConnectorRegistry {
  private connectors = new Map<string, MCPConnector>();

  register(connector: MCPConnector): void {
    this.connectors.set(connector.id, connector);
    console.log(`[ConnectorRegistry] Registered ${connector.name} (${connector.id})`);
  }

  get(id: string): MCPConnector | undefined {
    return this.connectors.get(id);
  }

  getAll(): MCPConnector[] {
    return Array.from(this.connectors.values());
  }

  getByCapability(capability: MCPCapability): MCPConnector[] {
    return this.getAll().filter(c => c.capabilities.includes(capability));
  }
}

export const connectorRegistry = new ConnectorRegistry();
