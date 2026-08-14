import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const workflowId = url.searchParams.get("workflowId");

    let whereClause = {};
    if (workflowId) {
      whereClause = { workflowId };
    }

    // 1. Decisions
    const decisions: any[] = [];

    // 2. Graph Edges (EntityRelationships)
    const edges: any[] = [];

    return NextResponse.json({
      decisions,
      edges
    });

  } catch (error) {
    console.error("[Admin API] Failed to fetch memory", error);
    return NextResponse.json({ error: "Failed to fetch memory" }, { status: 500 });
  }
}
