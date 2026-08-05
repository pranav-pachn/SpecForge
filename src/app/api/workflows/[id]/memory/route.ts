import { NextResponse } from "next/server";
import { DecisionQuery } from '@/intelligence/memory/DecisionQuery';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Basic auth check if applicable
    // await requireAuth();

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || undefined;

    const memories = await DecisionQuery.getConsolidatedTimeline(params.id, typeFilter);

    return NextResponse.json(memories);
  } catch (error: any) {
    console.error("[Memory API] Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch engineering memory timeline" },
      { status: 500 }
    );
  }
}
