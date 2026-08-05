import { Notification } from "@prisma/client";
import { NotificationPort } from "../../notifications/NotificationPort";

export class SlackAdapter implements NotificationPort {
  async dispatch(notification: Notification, config: any): Promise<boolean> {
    const { webhookUrl, channel } = config;
    if (!webhookUrl) return false;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: channel || undefined,
          text: `*${notification.title}*\n${notification.body || ""}`
        })
      });

      return response.ok;
    } catch (e) {
      console.error("[SlackAdapter] Delivery failed:", e);
      return false;
    }
  }
}
