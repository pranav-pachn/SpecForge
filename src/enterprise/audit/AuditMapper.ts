import { PlatformEventType, PlatformEventPayload } from "../events/PlatformEventBus";
import { Prisma } from "@prisma/client";
import { PayloadSanitizer } from "./PayloadSanitizer";

export class AuditMapper {
  /**
   * Transforms a PlatformEvent into an AuditLog append payload.
   */
  static toAuditLogCreate(event: PlatformEventType, payload: PlatformEventPayload): Omit<Prisma.AuditLogUncheckedCreateInput, "id" | "createdAt"> | null {
    if (!payload.orgId) {
      return null; // OrgId is required for enterprise audit
    }

    const sanitizedPayload = PayloadSanitizer.sanitize(payload.metadata || {});

    // Include other core fields from payload into the JSON block if useful
    if (payload.workflowId) sanitizedPayload.workflowId = payload.workflowId;
    if (payload.node) sanitizedPayload.node = payload.node.id;

    return {
      organizationId: payload.orgId,
      userId: payload.userId || null,
      eventType: event,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      correlationId: payload.correlationId,
      causationId: payload.causationId || null,
      source: payload.userId ? "API" : "SYSTEM", // Rough heuristic. Can be extended if event bus takes a 'source'
      payload: sanitizedPayload
    };
  }
}
