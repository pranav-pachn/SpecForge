import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string; memoryId: string } }
) {
  try {
    const revisions = await db.memoryRevision.findMany({
      where: {
        memoryId: params.memoryId,
        memory: {
          workflowId: params.id
        }
      },
      orderBy: {
        revision: "desc"
      }
    });

    return NextResponse.json(revisions);
  } catch (error: any) {
    console.error("[Memory Revisions API] Failed to fetch revisions", error);
    return NextResponse.json(
      { error: "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}
