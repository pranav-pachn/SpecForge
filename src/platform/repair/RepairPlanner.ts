import { RepairDiagnosis, RepairPlan } from "./interfaces";
import { RepairPolicy } from "./RepairPolicy";

export class RepairPlanner {
  static plan(diagnosis: RepairDiagnosis, agentId: string): RepairPlan | null {
    const config = RepairPolicy.getConfig(agentId);

    // 1. Check if allowed
    if (!config.allowedStrategies.includes(diagnosis.recommendedStrategy)) {
      console.warn(`[RepairPlanner] Strategy ${diagnosis.recommendedStrategy} not allowed for agent ${agentId}`);
      // Fallback to the first allowed strategy if available
      if (config.allowedStrategies.length > 0) {
        diagnosis.recommendedStrategy = config.allowedStrategies[0];
      } else {
        return null; // Cannot repair
      }
    }

    // 2. Limit sections
    const targetSections = diagnosis.targetSections.slice(0, config.sectionLimit);
    if (targetSections.length === 0) return null;

    return {
      diagnosis,
      targetSections,
      strategy: diagnosis.recommendedStrategy,
      confidence: 0.85 // Heuristic confidence
    };
  }
}
