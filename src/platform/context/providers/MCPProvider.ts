import { ContextProvider } from "./ContextProvider";
import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextPolicy } from "../interfaces/ContextPolicy";
import { ContextItem } from "../interfaces/RetrievedContext";
import { mcpBroker } from "../../mcp/MCPBroker";
import { MCPCapability } from "../../mcp/interfaces/MCPCapability";

export class MCPProvider implements ContextProvider {
  readonly name = "MCP";

  supports(request: ContextRequest, policy: ContextPolicy): boolean {
    return policy.sources.includes(this.name);
  }

  async retrieve(request: ContextRequest, policy: ContextPolicy): Promise<ContextItem[]> {
    // Phase 8: The Context Layer delegates to the Platform MCP Broker
    // Context mapping might eventually use an LLM or predefined logic to pick capabilities.
    // For now, if the query includes certain words, we trigger specific searches.
    let capability = MCPCapability.SEARCH_DOCS;
    if (request.query.toLowerCase().includes("code")) capability = MCPCapability.SEARCH_CODE;
    else if (request.query.toLowerCase().includes("file")) capability = MCPCapability.SEARCH_FILES;
    
    try {
      return await mcpBroker.search({
        id: crypto.randomUUID(),
        capability,
        query: request.query,
        workflowId: request.workflowId,
        callerType: "CONTEXT"
      });
    } catch (e: any) {
      console.warn(`[MCPProvider] Graceful degradation - MCP Broker search failed: ${e.message}`);
      return [];
    }
  }
}

export const mcpProvider = new MCPProvider();
