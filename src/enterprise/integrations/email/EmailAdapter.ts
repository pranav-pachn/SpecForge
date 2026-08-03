import { Notification } from "@prisma/client";
import { NotificationPort } from "../../notifications/NotificationPort";

export class EmailAdapter implements NotificationPort {
  async dispatch(notification: Notification, config: any): Promise<boolean> {
    const { toEmail } = config;
    if (!toEmail) return false;

    try {
      // In a real application, you would use Resend, SendGrid, or Nodemailer here.
      console.log(`[EmailAdapter] Sending email to ${toEmail}: ${notification.title}`);
      
      // Mock success for now
      return true;
    } catch (e) {
      console.error("[EmailAdapter] Delivery failed:", e);
      return false;
    }
  }
}
