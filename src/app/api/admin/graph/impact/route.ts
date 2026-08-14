import { NextResponse } from "next/server";
import { GraphTraversalService } from "@/platform/graph/GraphTraversalService";

export async function POST(req: Request) {
  try {
    const { nodeId } = await req.json();
    if (!nodeId) {
      return NextResponse.json({ error: "nodeId required" }, { status: 400 });
    }

    const report = await GraphTraversalService.findImpact(nodeId);
    if (!report) {
      return NextResponse.json({ error: "Node not found or no impact" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("[ImpactAPI] Error", error);
    return NextResponse.json({ error: "Failed to analyze impact" }, { status: 500 });
  }
}
