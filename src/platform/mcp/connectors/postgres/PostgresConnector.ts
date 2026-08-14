import { MCPConnector } from "../../interfaces/MCPConnector";
import { MCPCapability } from "../../interfaces/MCPCapability";
import { MCPRequest } from "../../interfaces/MCPRequest";
import { MCPResponse } from "../../interfaces/MCPResponse";
import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";
import { db } from "@/platform/storage/db";

export class PostgresConnector implements MCPConnector {
  id = "postgres";
  name = "PostgreSQL";
  type = "DATABASE" as const;
  capabilities = [
    MCPCapability.SEARCH_RECORDS,
    MCPCapability.LIST_TABLES,
    MCPCapability.GET_SCHEMA,
    MCPCapability.GET_WORKFLOW
  ];
  permissions = ["READ"];

  async isAvailable(): Promise<boolean> { 
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
  
  supports(capability: MCPCapability): boolean { return this.capabilities.includes(capability); }
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}

  async search(request: MCPRequest): Promise<ContextItem[]> {
    return [{
      source: this.id,
      provider: "MCP",
      retrievalMethod: request.capability,
      content: `[Postgres] Mock records for ${request.query}`,
      score: 1.0,
      confidence: 1.0,
      freshness: 1.0,
      sourceId: "pg-mock-123"
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
