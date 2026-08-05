import { NextResponse } from "next/server";
import { db } from "@/platform/storage/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const driftEvents = await db.driftEvent.findMany({
      where: {
        version: {
          artifact: {
            workflowId: params.id
          }
        },
        status: "OPEN"
      },
      include: {
        sourceVersion: {
          include: { artifact: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(driftEvents);
  } catch (error: any) {
    console.error("[Drift API] Failed to fetch drift events", error);
    return NextResponse.json(
      { error: "Failed to fetch drift events" },
      { status: 500 }
    );
  }
}
