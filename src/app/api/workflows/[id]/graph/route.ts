import { NextRequest, NextResponse } from "next/server";
import { GraphService } from "@/lib/intelligence/graph/GraphService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    
    // Fetch nodes and edges from the business layer facade
    const nodes = await GraphService.getWorkflowNodes(workflowId);
    const edges = await GraphService.getWorkflowEdges(workflowId);

    // Filter out edges that point to non-existent nodes in our result set
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const validEdges = edges.filter((e: any) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId));

    return NextResponse.json({
      nodes,
      edges: validEdges
    });
  } catch (error) {
    console.error("[Graph API] Error fetching graph:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph data" },
      { status: 500 }
    );
  }
}
