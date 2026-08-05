import { Notification } from "@prisma/client";
import { NotificationPort } from "../../notifications/NotificationPort";

export class TeamsAdapter implements NotificationPort {
  async dispatch(notification: Notification, config: any): Promise<boolean> {
    const { webhookUrl } = config;
    if (!webhookUrl) return false;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": notification.title,
          "sections": [{
            "activityTitle": notification.title,
            "activitySubtitle": notification.body || ""
          }]
        })
      });

      return response.ok;
    } catch (e) {
      console.error("[TeamsAdapter] Delivery failed:", e);
      return false;
    }
  }
}
