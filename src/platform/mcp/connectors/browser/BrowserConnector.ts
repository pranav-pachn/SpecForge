import { MCPConnector } from "../../interfaces/MCPConnector";
import { MCPCapability } from "../../interfaces/MCPCapability";
import { MCPRequest } from "../../interfaces/MCPRequest";
import { MCPResponse } from "../../interfaces/MCPResponse";
import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";

export class BrowserConnector implements MCPConnector {
  id = "browser";
  name = "Browser (HTTP Fetch)";
  type = "BROWSER" as const;
  capabilities = [
    MCPCapability.FETCH_URL,
    MCPCapability.SEARCH_WEB,
    MCPCapability.SCRAPE
  ];
  permissions = ["EXECUTE"];

  async isAvailable(): Promise<boolean> { return true; }
  supports(capability: MCPCapability): boolean { return this.capabilities.includes(capability); }
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async search(request: MCPRequest): Promise<ContextItem[]> {
    return [{
      source: this.id,
      provider: "MCP",
      retrievalMethod: request.capability,
      content: `[Browser] Web results for ${request.query}`,
      score: 0.8,
      confidence: 0.8,
      freshness: 1.0,
      sourceId: "web-mock-123"
    }];
  }

  async execute(request: MCPRequest): Promise<MCPResponse> {
    // Phase 8 Stub: Simple HTTP Fetch instead of full Playwright
    let result: any = null;
    if (request.capability === MCPCapability.FETCH_URL && request.params?.url) {
      try {
        const response = await fetch(request.params.url as string);
        const text = await response.text();
        // Here we would parse HTML and extract text
        result = { text: text.substring(0, 1000) + "..." };
      } catch (e: any) {
        throw new Error(`Browser fetch failed: ${e.message}`);
      }
    } else {
      result = { success: true };
    }

    return {
      connectorId: this.id,
      capability: request.capability,
      result,
      latencyMs: 0,
      retryCount: 0,
      cached: false
    };
  }
}
