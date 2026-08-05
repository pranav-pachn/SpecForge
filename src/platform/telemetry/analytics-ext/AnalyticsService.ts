import { PlatformEventBus, PlatformEventType, PlatformEventPayload } from '@/platform/events/PlatformEventBus';
import { MetricCollector } from "./MetricCollector";
import { MetricRollupRepository } from "./MetricRollupRepository";

export class AnalyticsService {
  
  static initialize() {
    const triggerEvents: PlatformEventType[] = [
      "WORKFLOW_COMPLETED",
      "REVIEW_COMPLETED",
      "VALIDATION_COMPLETED",
      "DRIFT_RESOLVED",
      "APPROVAL_COMPLETED"
    ];

    for (const event of triggerEvents) {
      PlatformEventBus.subscribe(event, async (payload) => {
        await this.handleEvent(event, payload);
      });
    }
  }

  private static async handleEvent(event: PlatformEventType, payload: PlatformEventPayload) {
    if (!payload.orgId) return;

    try {
      // 1. Recalculate metrics for the entire Org
      const orgMetrics = await MetricCollector.collect(payload.orgId);
      await MetricRollupRepository.upsert(payload.orgId, null, "DAILY", orgMetrics);

      // 2. We can also optionally build WEEKLY / MONTHLY rollups concurrently
      await MetricRollupRepository.upsert(payload.orgId, null, "WEEKLY", orgMetrics);
      await MetricRollupRepository.upsert(payload.orgId, null, "MONTHLY", orgMetrics);

      // 3. If event is scoped to a specific team (e.g. from workflow), rollup for that team too
      // (This requires passing teamId in the event payload or resolving it via entityId, we leave this as a future enhancement)
      
    } catch (e) {
      console.error(`[AnalyticsService] Failed to calculate rollups on event ${event}:`, e);
    }
  }
}
