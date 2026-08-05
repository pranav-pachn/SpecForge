import { db } from "@/platform/storage/db";
import { PlatformEventBus, PlatformEventType, PlatformEventPayload } from '@/platform/events/PlatformEventBus';
import { NotificationRegistry } from "./NotificationRegistry";

// Pre-register Adapters (In a real app, this might happen in a bootstrapper)
import { InAppAdapter } from "../integrations/inapp/InAppAdapter";
import { SlackAdapter } from "../integrations/slack/SlackAdapter";
import { TeamsAdapter } from "../integrations/teams/TeamsAdapter";
import { EmailAdapter } from "../integrations/email/EmailAdapter";

NotificationRegistry.register("IN_APP", new InAppAdapter());
NotificationRegistry.register("SLACK", new SlackAdapter());
NotificationRegistry.register("TEAMS", new TeamsAdapter());
NotificationRegistry.register("EMAIL", new EmailAdapter());

export class NotificationService {
  
  static initialize() {
    // Subscribe to all platform events
    const allEvents: PlatformEventType[] = [
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

  private static mapEvent(event: PlatformEventType, payload: PlatformEventPayload): { title: string, body?: string } {
    switch (event) {
      case "APPROVAL_REQUESTED": return { title: "Approval Needed", body: `An approval request was created for ${payload.entityType}` };
      case "APPROVAL_STEP_COMPLETED": return { title: "Approval Step Completed", body: `An approval step was completed for ${payload.entityType}` };
      case "APPROVAL_COMPLETED": return { title: "Approval Granted", body: `Approval chain completed for ${payload.entityType}` };
      case "APPROVAL_REJECTED": return { title: "Approval Rejected", body: `An approval request was rejected for ${payload.entityType}` };
      case "DRIFT_DETECTED": return { title: "Drift Alert", body: "A new drift was detected in the architecture." };
      case "REVIEW_COMPLETED": return { title: "Review Finished", body: `An engineering review was completed.` };
      default: return { title: `Event: ${event}`, body: `A new ${event} occurred in the system.` };
    }
  }

  static async handleEvent(event: PlatformEventType, payload: PlatformEventPayload) {
    if (!payload.orgId || !payload.userId) return;

    const { title, body } = this.mapEvent(event, payload);

    // 1. Always create the IN_APP notification
    const notification = await db.notification.create({
      data: {
        userId: payload.userId,
        orgId: payload.orgId,
        event,
        title,
        body,
        entityId: payload.entityId,
        channel: "IN_APP"
      }
    });

    // 2. Fetch external channels configured for the organization
    const channels = await db.notificationChannel.findMany({
      where: { organizationId: payload.orgId, enabled: true }
    });

    // 3. Fetch user preferences
    const preferences = await db.notificationPreference.findMany({
      where: { userId: payload.userId }
    });

    const prefMap = new Map(preferences.map(p => [p.channelType, p.enabled]));

    // 4. Attempt delivery for each external channel
    for (const channel of channels) {
      // Check if user disabled this channel type
      if (prefMap.has(channel.channelType) && !prefMap.get(channel.channelType)) {
        continue;
      }

      const adapter = NotificationRegistry.get(channel.channelType);
      
      if (!adapter) {
        await this.logDelivery(notification.id, channel.channelType, "FAILED", "Adapter not found");
        continue;
      }

      try {
        const success = await adapter.dispatch(notification, channel.config);
        
        if (success) {
          await this.logDelivery(notification.id, channel.channelType, "SUCCESS");
        } else {
          await this.logDelivery(notification.id, channel.channelType, "FAILED", "Dispatch returned false");
        }
      } catch (err: any) {
        await this.logDelivery(notification.id, channel.channelType, "FAILED", err.message);
      }
    }
  }

  private static async logDelivery(notificationId: string, channelType: string, status: string, error?: string) {
    await db.notificationDelivery.create({
      data: {
        notificationId,
        channelType,
        status,
        error
      }
    });
  }
}
