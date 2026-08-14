export interface LearningPolicy {
  minWorkflows: number;
  minConfidence: number;
  minEvidence: number;
  requireHumanApproval: boolean;
}

export class LearningPolicies {
  private static globalPolicy: LearningPolicy = {
    minWorkflows: 25,
    minConfidence: 85,
    minEvidence: 10,
    requireHumanApproval: true
  };

  private static projectOverrides: Map<string, Partial<LearningPolicy>> = new Map();

  static getPolicy(projectId?: string): LearningPolicy {
    if (!projectId || !this.projectOverrides.has(projectId)) {
      return { ...this.globalPolicy };
    }
    
    return {
      ...this.globalPolicy,
      ...this.projectOverrides.get(projectId)!
    };
  }

  static setProjectOverride(projectId: string, override: Partial<LearningPolicy>) {
    this.projectOverrides.set(projectId, override);
  }

  static updateGlobalPolicy(policy: Partial<LearningPolicy>) {
    this.globalPolicy = {
      ...this.globalPolicy,
      ...policy
    };
  }
}
