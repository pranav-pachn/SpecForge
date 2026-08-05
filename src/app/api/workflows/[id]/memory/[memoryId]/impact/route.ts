import { NextResponse } from "next/server";
import { ImpactAnalyzer } from "@/intelligence/memory/ImpactAnalyzer";
import { db } from "@/platform/storage/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string; memoryId: string } }
) {
  try {
    const memory = await db.engineeringMemory.findUnique({
      where: { id: params.memoryId }
    });

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404 }
      );
    }

    const impact = await ImpactAnalyzer.analyze(params.memoryId, memory.severity);

    return NextResponse.json(impact);
  } catch (error: any) {
    console.error("[Memory API] Error computing impact:", error);
    return NextResponse.json(
      { error: "Failed to compute impact analysis" },
      { status: 500 }
    );
  }
}
