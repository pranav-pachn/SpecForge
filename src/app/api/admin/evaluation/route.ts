import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const capability = searchParams.get("capability");
    
    let whereClause: any = {};
    if (workflowId) whereClause.workflowId = workflowId;
    if (capability) whereClause.capability = capability;

    const runs = await db.evaluationRun.findMany({
      where: whereClause,

      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("[EvaluationAdminAPI] Error fetching evaluation runs:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation runs" }, { status: 500 });
  }
}
