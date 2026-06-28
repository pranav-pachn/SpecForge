import { EventType } from "@prisma/client";

/**
 * Lightweight instrumentation helper to log events directly to the database.
 * We use a "fire and forget" pattern to avoid blocking the main request thread.
 */
export function logEvent(
  eventType: EventType,
  data?: { workflowId?: string; userId?: string; metadata?: Record<string, any> }
) {
  // In a real app we'd get the current user session here if userId is not provided
  
  // Fire and forget pattern - we don't await this so it doesn't block
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      workflowId: data?.workflowId,
      userId: data?.userId,
      metadata: data?.metadata ? JSON.stringify(data.metadata) : undefined,
    }),
  }).catch((err) => {
    // Silently fail instrumentation errors to prevent crashing the app
    console.error(`Failed to log event ${eventType}:`, err);
  });
}
