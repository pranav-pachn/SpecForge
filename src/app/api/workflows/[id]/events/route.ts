import { NextRequest, NextResponse } from "next/server";
import { PlatformEventBus } from "@/platform/events/PlatformEventBus";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fromSequence = searchParams.get('fromSequence') ? parseInt(searchParams.get('fromSequence')!) : undefined;
    const toSequence = searchParams.get('toSequence') ? parseInt(searchParams.get('toSequence')!) : undefined;

    const store = PlatformEventBus.getStore();
    const events = await store.getEvents(params.id, {
      fromSequence,
      toSequence
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("[Events API] Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow events", details: error.message },
      { status: 500 }
    );
  }
}
