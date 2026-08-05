import { db } from "@/platform/storage/db";

export type PolicyAction = 
  | { type: "AUTO_APPROVE" }
  | { type: "REQUIRE_APPROVAL"; roles: string[]; minApprovers: number }
  | { type: "NO_POLICY" };

export class PolicyEngine {
  
  /**
   * Evaluates if any configured policies match the given entity and trigger condition.
   * Returns the required action.
   */
  static async evaluate(
    organizationId: string, 
    entityType: string, 
    trigger: string,
    metadata?: Record<string, any>
  ): Promise<PolicyAction> {
    
    // Find the applicable policy for this org + entity + trigger
    // In a mature system, this might evaluate complex conditions from `metadata` (e.g. Risk=HIGH).
    const policy = await db.policy.findFirst({
      where: {
        organizationId,
        entityType,
        trigger
      }
    });

    if (!policy) {
      return { type: "NO_POLICY" };
    }

    if (policy.autoApprove) {
      return { type: "AUTO_APPROVE" };
    }

    if (policy.requiredRoles.length > 0) {
      return { 
        type: "REQUIRE_APPROVAL", 
        roles: policy.requiredRoles, 
        minApprovers: policy.minApprovers 
      };
    }

    return { type: "NO_POLICY" };
  }
}
