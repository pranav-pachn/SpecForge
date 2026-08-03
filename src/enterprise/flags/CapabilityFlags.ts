import { db } from "@/lib/db";
import { OrgPlan } from "@prisma/client";

/**
 * Default capability flags mapped to organization plans.
 */
const PLAN_DEFAULTS: Record<OrgPlan, string[]> = {
  FREE: [
    "copilot",
  ],
  PRO: [
    "copilot",
    "audit_log",
    "approval_chains",
    "analytics",
    "templates"
  ],
  ENTERPRISE: [
    "copilot",
    "audit_log",
    "approval_chains",
    "analytics",
    "templates",
    "sso",
    "scim",
    "compliance_export"
  ]
};

export class CapabilityFlags {
  /**
   * Initializes default flags for a new organization based on its plan.
   */
  static async seed(organizationId: string, plan: OrgPlan = "FREE") {
    const flags = PLAN_DEFAULTS[plan] || [];
    
    // Use upsert to avoid failing if flags already exist
    for (const flag of flags) {
      await db.capabilityFlag.upsert({
        where: {
          organizationId_flag: {
            organizationId,
            flag
          }
        },
        create: {
          organizationId,
          flag,
          enabled: true
        },
        update: {
          enabled: true
        }
      });
    }
  }

  /**
   * Checks if an organization has a specific capability enabled.
   */
  static async check(organizationId: string, flag: string): Promise<boolean> {
    const record = await db.capabilityFlag.findUnique({
      where: {
        organizationId_flag: {
          organizationId,
          flag
        }
      }
    });
    return record?.enabled ?? false;
  }

  /**
   * Require a flag to be enabled, otherwise throws an Error.
   * Useful in API routes or PermissionGuards.
   */
  static async require(organizationId: string, flag: string) {
    const isEnabled = await this.check(organizationId, flag);
    if (!isEnabled) {
      throw new Error(`Capability '${flag}' is not enabled for this organization.`);
    }
  }

  /**
   * Manually enable or disable a flag for an organization (e.g. for beta features).
   */
  static async set(organizationId: string, flag: string, enabled: boolean) {
    await db.capabilityFlag.upsert({
      where: {
        organizationId_flag: {
          organizationId,
          flag
        }
      },
      create: {
        organizationId,
        flag,
        enabled
      },
      update: {
        enabled
      }
    });
  }
}
