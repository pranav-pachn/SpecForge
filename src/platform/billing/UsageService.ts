import { db } from "@/platform/storage/db";
import { Capabilities } from "./EntitlementRegistry";

export class UsageService {
  /**
   * Retrieves the current usage count for a specific capability limit in the current billing period.
   */
  static async getCurrentUsage(orgId: string, metric: keyof Capabilities): Promise<number> {
    const now = new Date();
    // Simplified period: Current month
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const record = await db.usageRecord.findUnique({
      where: {
        organizationId_metric_periodStart: {
          organizationId: orgId,
          metric: metric as string,
          periodStart
        }
      }
    });

    return record?.count || 0;
  }
}
