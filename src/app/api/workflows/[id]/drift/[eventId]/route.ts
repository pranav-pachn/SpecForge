import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";
import { DriftEventStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const { status } = await request.json();

    if (!Object.values(DriftEventStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await db.driftEvent.update({
      where: {
        id: params.eventId,
        version: { artifact: { workflowId: params.id } }
      },
      data: {
        status,
        ...(status === "RESOLVED" || status === "IGNORED" 
          ? { resolvedAt: new Date(), resolvedBy: "user_id_here" } 
          : {})
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[Drift API] Failed to update drift event", error);
    return NextResponse.json(
      { error: "Failed to update drift event" },
      { status: 500 }
    );
  }
}
