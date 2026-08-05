import { PlatformEventBus, PlatformEventType, PlatformEventPayload } from '@/platform/events/PlatformEventBus';
import { AuditMapper } from "./AuditMapper";
import { AuditRepository } from "./AuditRepository";

export class AuditLogger {
  
  static initialize() {
    // Subscribe to all platform events for logging
    const allEvents: PlatformEventType[] = [
      "NODE_CREATED", "NODE_UPDATED", "NODE_DELETED", "EDGE_CREATED", "EDGE_REMOVED",
      "WORKFLOW_CREATED", "WORKFLOW_COMPLETED", "DRIFT_DETECTED",
      "APPROVAL_REQUESTED", "APPROVAL_STEP_COMPLETED", "APPROVAL_COMPLETED",
      "APPROVAL_REJECTED", "APPROVAL_CANCELLED", "SPEC_SUBMITTED",
      "SPEC_APPROVED", "SPEC_REJECTED", "REVIEW_REQUESTED", "REVIEW_COMPLETED",
      "MEMBER_INVITED", "MEMBER_JOINED", "POLICY_CREATED", "MEMORY_GENERATED",
      "MEMORY_APPROVED", "MEMORY_REJECTED"
    ];

    for (const event of allEvents) {
      PlatformEventBus.subscribe(event, async (payload) => {
        await this.handleEvent(event, payload);
      });
    }
  }

  private static async handleEvent(event: PlatformEventType, payload: PlatformEventPayload) {
    try {
      const auditPayload = AuditMapper.toAuditLogCreate(event, payload);
      
      if (auditPayload) {
        await AuditRepository.append(auditPayload);
      }
    } catch (e) {
      // In enterprise systems, failure to audit might need to crash the process or alert heavily.
      console.error(`[AuditLogger] Failed to write audit log for event ${event}:`, e);
    }
  }
}
