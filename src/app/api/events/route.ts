import { NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    const event = await prisma.eventLog.create({
      data: {
        eventType: data.eventType,
        workflowId: data.workflowId,
        userId: data.userId,
        metadata: data.metadata,
      },
    });

    return NextResponse.json({ success: true, id: event.id });
  } catch (error) {
    console.error("Failed to log event:", error);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }
}
