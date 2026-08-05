import { NotificationPort } from "./NotificationPort";

/**
 * Dynamic registry for Notification Adapters to ensure
 * NotificationService doesn't tightly couple to specific implementations.
 */
export class NotificationRegistry {
  private static adapters = new Map<string, NotificationPort>();

  static register(channelType: string, adapter: NotificationPort) {
    this.adapters.set(channelType, adapter);
  }

  static get(channelType: string): NotificationPort | undefined {
    return this.adapters.get(channelType);
  }
}
