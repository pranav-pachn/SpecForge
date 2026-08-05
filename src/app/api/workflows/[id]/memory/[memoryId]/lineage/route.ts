import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string; memoryId: string } }
) {
  try {
    // Relationships where this memory is the source (Leads To)
    const leadsToRels = await db.memoryRelationship.findMany({
      where: {
        sourceType: "MEMORY",
        sourceId: params.memoryId,
      }
    });

    // Relationships where this memory is the target (Derived From)
    const derivedFromRels = await db.memoryRelationship.findMany({
      where: {
        targetType: "MEMORY",
        targetId: params.memoryId,
      }
    });

    const lineage = {
      derivedFrom: derivedFromRels.map(rel => ({
        type: rel.sourceType,
        id: rel.sourceId,
        relation: rel.relationType
      })),
      leadsTo: leadsToRels.map(rel => ({
        type: rel.targetType,
        id: rel.targetId,
        relation: rel.relationType
      }))
    };

    return NextResponse.json(lineage);
  } catch (error: any) {
    console.error("[Lineage API] Failed to fetch lineage", error);
    return NextResponse.json(
      { error: "Failed to fetch lineage" },
      { status: 500 }
    );
  }
}
