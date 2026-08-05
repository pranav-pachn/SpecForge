import { db } from "@/platform/storage/db";
import { PlatformEventBus, PlatformEventType, PlatformEventPayload } from '@/platform/events/PlatformEventBus';
import { Capabilities } from "./EntitlementRegistry";

export class UsageRecorder {
  
  static initialize() {
    // Map platform events to usage metrics
    const eventToMetricMap: Partial<Record<PlatformEventType, keyof Capabilities>> = {
      "WORKFLOW_CREATED": "maxWorkflows",
      "MEMBER_JOINED": "maxMembers",
      // Add other usage increment events here
    };

    for (const [event, metric] of Object.entries(eventToMetricMap)) {
      PlatformEventBus.subscribe(event as PlatformEventType, async (payload) => {
        await this.recordUsage(payload, metric as string);
      });
    }
  }

  private static async recordUsage(payload: PlatformEventPayload, metric: string) {
    if (!payload.orgId) return;

    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    try {
      await db.usageRecord.upsert({
        where: {
          organizationId_metric_periodStart: {
            organizationId: payload.orgId,
            metric,
            periodStart
          }
        },
        update: {
          count: { increment: 1 }
        },
        create: {
          organizationId: payload.orgId,
          metric,
          count: 1,
          periodStart,
          periodEnd
        }
      });
    } catch (e) {
      console.error(`[UsageRecorder] Failed to record usage for metric ${metric}:`, e);
    }
  }
}
