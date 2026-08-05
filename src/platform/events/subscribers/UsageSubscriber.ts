import { db } from "@/platform/storage/db";
import { EventSubscriber } from "../dispatcher/EventSubscriber";
import { DomainEvent } from "../DomainEvent";

import { DomainEventType } from '../DomainEventType';

export class UsageSubscriber implements EventSubscriber {
  eventTypes: DomainEventType[] = ["WorkflowCreated", "WorkflowStarted", "MemberJoined", "ResourceUtilized"];
  priority = 50;

  async handle(event: DomainEvent<any>): Promise<void> {
    const orgId = await this.getOrganizationId(event);
    if (!orgId) return;

    let metric = "";
    let increment = 1;

    switch (event.type) {
      case "WorkflowCreated":
      case "WorkflowStarted":
        metric = "maxWorkflows";
        break;
      case "MemberJoined":
        metric = "maxMembers";
        break;
      case "ResourceUtilized":
        metric = "ai_tokens_used";
        increment = event.payload?.tokensUsed || 0;
        break;
      default:
        return; // Event not mapped to usage metric
    }

    if (increment > 0 && metric) {
      await this.recordUsage(orgId, metric, increment);
    }
  }

  private async getOrganizationId(event: DomainEvent<any>): Promise<string | null> {
    // Some events carry orgId directly in payload (e.g. from PlatformEventBus legacy mapping or specific payloads)
    if (event.payload?.orgId) {
      return event.payload.orgId;
    }

    // Otherwise fetch from workflow
    if (event.workflowId) {
      const workflow = await db.workflow.findUnique({
        where: { id: event.workflowId },
        select: { organizationId: true }
      });
      return workflow?.organizationId || null;
    }

    return null;
  }

  private async recordUsage(orgId: string, metric: string, increment: number) {
    const now = new Date();
    // Start of current month in UTC
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    // End of current month in UTC
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    try {
      await db.usageRecord.upsert({
        where: {
          organizationId_metric_periodStart: {
            organizationId: orgId,
            metric,
            periodStart
          }
        },
        update: {
          count: { increment }
        },
        create: {
          organizationId: orgId,
          metric,
          count: increment,
          periodStart,
          periodEnd
        }
      });
    } catch (e) {
      console.error(`[UsageSubscriber] Failed to record usage for metric ${metric}:`, e);
    }
  }
}
