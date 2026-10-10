import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { connectorRegistry } from "@/platform/mcp/registry/ConnectorRegistry";
import { connectorHealthMonitor } from "@/platform/mcp/health/ConnectorHealthMonitor";
import { db } from "@/platform/storage/db";

export async function GET() {
  try {
    const connectors = connectorRegistry.getAll();
    const stats = connectors.map(c => {
      const health = connectorHealthMonitor.getStats(c.id);
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        capabilities: c.capabilities,
        permissions: c.permissions,
        health
      };
    });

    // Recent executions omitted as table does not exist
    const executions: any[] = [];

    return NextResponse.json({ connectors: stats, executions });
  } catch (error) {
    console.error("[MCPAdminAPI] Error fetching MCP stats", error);
    return NextResponse.json({ error: "Failed to fetch MCP stats" }, { status: 500 });
  }
}
