import { Notification } from "@prisma/client";

/**
 * Interface defining how a Notification adapter must behave.
 */
export interface NotificationPort {
  /**
   * Dispatches the notification.
   * @param notification The notification entity to deliver.
   * @param config The channel configuration (e.g. webhook URLs, channel names).
   * @returns true if successful, false otherwise.
   */
  dispatch(notification: Notification, config: any): Promise<boolean>;
}
