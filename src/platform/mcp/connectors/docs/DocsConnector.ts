import { MCPConnector } from "../../interfaces/MCPConnector";
import { MCPCapability } from "../../interfaces/MCPCapability";
import { MCPRequest } from "../../interfaces/MCPRequest";
import { MCPResponse } from "../../interfaces/MCPResponse";
import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";

export class DocsConnector implements MCPConnector {
  id = "docs";
  name = "Documentation Search";
  type = "DOCUMENTS" as const;
  capabilities = [
    MCPCapability.SEARCH_DOCS,
    MCPCapability.READ_MARKDOWN,
    MCPCapability.SUMMARIZE_DOC
  ];
  permissions = ["READ"];

  async isAvailable(): Promise<boolean> { return true; }
  supports(capability: MCPCapability): boolean { return this.capabilities.includes(capability); }
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async search(request: MCPRequest): Promise<ContextItem[]> {
    return [{
      source: this.id,
      provider: "MCP",
      retrievalMethod: request.capability,
      content: `[Docs] Found documentation matching ${request.query}`,
      score: 1.0,
      confidence: 1.0,
      freshness: 1.0,
      sourceId: "doc-mock-123"
    }];
  }

  async execute(request: MCPRequest): Promise<MCPResponse> {
    return {
      connectorId: this.id,
      capability: request.capability,
      result: { success: true },
      latencyMs: 0,
      retryCount: 0,
      cached: false
    };
  }
}
