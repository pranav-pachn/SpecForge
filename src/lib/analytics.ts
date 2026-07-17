import prisma from "@/lib/prisma";
import { EventType } from "@prisma/client";

export async function trackEvent(
  eventType: EventType,
  data?: {
    workflowId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    await prisma.eventLog.create({
      data: {
        eventType,
        workflowId: data?.workflowId,
        userId: data?.userId,
        metadata: data?.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to track event:", error);
    // Silent fail so we don't crash the main application
  }
}
