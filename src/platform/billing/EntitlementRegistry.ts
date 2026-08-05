export interface Capabilities {
  approvals: boolean;
  analytics: boolean;
  graph: boolean;
  copilot: boolean;
  templates: boolean;
  policies: boolean;
  sso: boolean;
  maxWorkflows: number;
  maxMembers: number;
  maxProjects: number;
}

export type OrgPlanType = "FREE" | "PRO" | "ENTERPRISE";

export class EntitlementRegistry {
  private static readonly tiers: Record<OrgPlanType, Capabilities> = {
    FREE: {
      approvals: false,
      analytics: false,
      graph: true,
      copilot: false,
      templates: false,
      policies: false,
      sso: false,
      maxWorkflows: 10,
      maxMembers: 3,
      maxProjects: 1
    },
    PRO: {
      approvals: true,
      analytics: true,
      graph: true,
      copilot: true,
      templates: true,
      policies: true,
      sso: false,
      maxWorkflows: 100,
      maxMembers: 20,
      maxProjects: 10
    },
    ENTERPRISE: {
      approvals: true,
      analytics: true,
      graph: true,
      copilot: true,
      templates: true,
      policies: true,
      sso: true,
      maxWorkflows: 999999, // Unlimited
      maxMembers: 999999,
      maxProjects: 999999
    }
  };

  static getCapabilities(plan: OrgPlanType): Capabilities {
    return this.tiers[plan];
  }

  static getFeatureName(feature: keyof Capabilities): string {
    const names: Record<keyof Capabilities, string> = {
      approvals: "Human Approvals",
      analytics: "Enterprise Analytics",
      graph: "Knowledge Graph",
      copilot: "Engineering Copilot",
      templates: "Extensible Templates",
      policies: "Custom Policies",
      sso: "Single Sign-On",
      maxWorkflows: "Workflows",
      maxMembers: "Team Members",
      maxProjects: "Projects"
    };
    return names[feature] || feature;
  }
}
