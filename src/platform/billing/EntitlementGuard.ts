import { db } from "@/platform/storage/db";
import { EntitlementRegistry, Capabilities, OrgPlanType } from "./EntitlementRegistry";
import { UpgradeRequiredError } from "./UpgradeRequired";
import { UsageService } from "./UsageService";

export class EntitlementGuard {
  
  /**
   * Asserts that an organization has the required boolean capability.
   * Throws an UpgradeRequiredError if not.
   */
  static async requireCapability(orgId: string, feature: keyof Capabilities): Promise<void> {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
    if (!org) throw new Error("Organization not found");

    const plan = org.plan as OrgPlanType;
    const caps = EntitlementRegistry.getCapabilities(plan);

    const hasCapability = caps[feature];
    if (typeof hasCapability === "boolean" && !hasCapability) {
      const requiredTier = this.findMinimumTierForCapability(feature);
      const featureName = EntitlementRegistry.getFeatureName(feature);
      throw new UpgradeRequiredError(featureName, plan, requiredTier);
    }
  }

  /**
   * Asserts that an organization has not exceeded a numeric capability limit.
   * Throws an UpgradeRequiredError if limit reached.
   */
  static async requireUsageAllowance(orgId: string, metric: keyof Capabilities): Promise<void> {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { plan: true } });
    if (!org) throw new Error("Organization not found");

    const plan = org.plan as OrgPlanType;
    const caps = EntitlementRegistry.getCapabilities(plan);
    const limit = caps[metric];

    if (typeof limit === "number") {
      const currentUsage = await UsageService.getCurrentUsage(orgId, metric);
      if (currentUsage >= limit) {
        const requiredTier = this.findMinimumTierForLimit(metric, currentUsage + 1);
        const featureName = EntitlementRegistry.getFeatureName(metric);
        throw new UpgradeRequiredError(featureName, plan, requiredTier);
      }
    }
  }

  private static findMinimumTierForCapability(feature: keyof Capabilities): string {
    const tiers: OrgPlanType[] = ["FREE", "PRO", "ENTERPRISE"];
    for (const tier of tiers) {
      if (EntitlementRegistry.getCapabilities(tier)[feature] === true) return tier;
    }
    return "ENTERPRISE";
  }

  private static findMinimumTierForLimit(metric: keyof Capabilities, requiredCount: number): string {
    const tiers: OrgPlanType[] = ["FREE", "PRO", "ENTERPRISE"];
    for (const tier of tiers) {
      const limit = EntitlementRegistry.getCapabilities(tier)[metric];
      if (typeof limit === "number" && limit >= requiredCount) return tier;
    }
    return "ENTERPRISE"; // Or "Contact Sales"
  }
}
