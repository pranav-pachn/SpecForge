import { NextResponse } from "next/server";
import { GraphTraversalService } from "@/platform/graph/GraphTraversalService";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workflowId = url.searchParams.get("workflowId");
    
    if (!workflowId) {
      return NextResponse.json({ error: "workflowId required" }, { status: 400 });
    }

    const report = await GraphTraversalService.findCoverage(workflowId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("[CoverageAPI] Error", error);
    return NextResponse.json({ error: "Failed to calculate coverage" }, { status: 500 });
  }
}
