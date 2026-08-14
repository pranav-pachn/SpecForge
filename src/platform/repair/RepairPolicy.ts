import { RepairStrategy } from "./interfaces";

export interface AgentRepairConfig {
  maxAttempts: number;
  allowedStrategies: RepairStrategy[];
  escalationThreshold: number; // 0-100 score below which we don't attempt repair
  sectionLimit: number; // Max sections to repair in a single attempt
}

export class RepairPolicy {
  private static defaultPolicy: Record<string, AgentRepairConfig> = {
    'spec-agent': {
      maxAttempts: 3,
      allowedStrategies: ["EXPAND", "REWRITE", "CONSTRAIN"],
      escalationThreshold: 40,
      sectionLimit: 2
    },
    'arch-agent': {
      maxAttempts: 2,
      allowedStrategies: ["REWRITE", "EXPAND"],
      escalationThreshold: 50,
      sectionLimit: 1
    },
    'task-agent': {
      maxAttempts: 1,
      allowedStrategies: ["REWRITE"],
      escalationThreshold: 60,
      sectionLimit: 1
    },
    'security-auditor-agent': {
      maxAttempts: 0, // Never auto-repair security blocks by default, force human
      allowedStrategies: [],
      escalationThreshold: 100,
      sectionLimit: 0
    }
  };

  static getConfig(agentId: string): AgentRepairConfig {
    // If we have a specific policy, return it
    if (this.defaultPolicy[agentId]) {
      return this.defaultPolicy[agentId];
    }
    
    // Fallback default
    return {
      maxAttempts: 1,
      allowedStrategies: ["REWRITE"],
      escalationThreshold: 50,
      sectionLimit: 1
    };
  }
}
