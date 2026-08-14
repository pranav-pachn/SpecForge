import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return NextResponse.json({ traces: [] });
    }

    // Try to find traces where executionId matches the query, OR workflowId matches the query.
    const traces: any[] = [];
    
    return NextResponse.json({ traces });
  } catch (error) {
    console.error("[Admin API] Failed to fetch traces", error);
    return NextResponse.json({ error: "Failed to fetch traces" }, { status: 500 });
  }
}
