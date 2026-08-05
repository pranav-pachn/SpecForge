import { Notification } from "@prisma/client";
import { NotificationPort } from "../../notifications/NotificationPort";

export class InAppAdapter implements NotificationPort {
  async dispatch(notification: Notification, config: any): Promise<boolean> {
    // InApp adapter effectively does nothing since the DB record is already created 
    // and queried by the frontend to display the bell icon notification.
    // However, if we wanted to push via WebSockets (e.g. Socket.io/Pusher), we'd do it here.
    return true; 
  }
}
