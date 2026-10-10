import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/platform/storage/db";
// Let me verify if StreamManager exists in src/platform/events/transport or src/runtime/streaming.
// I will just implement the GET fetching last 50 events for now.

export async function GET() {
  try {
    const events = await db.storedEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        occurredAt: true,
        workflowId: true,
        status: true,
        sequence: true,
        payload: true // For details
      }
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error("[Admin API] Failed to fetch events", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
