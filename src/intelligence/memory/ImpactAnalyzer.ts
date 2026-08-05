import { RelationshipResolver } from "./RelationshipResolver";
import { ImpactAnalysis, CategorizedImpact } from "./MemorySchema";
import { MemorySeverity } from "@prisma/client";

export class ImpactAnalyzer {
  static async analyze(memoryId: string, memorySeverity: MemorySeverity = "MEDIUM"): Promise<ImpactAnalysis> {
    const nodes = await RelationshipResolver.expandRelationships(memoryId, 3);
    
    let baseScore = 50;
    if (memorySeverity === "CRITICAL") baseScore = 100;
    else if (memorySeverity === "HIGH") baseScore = 80;
    else if (memorySeverity === "LOW") baseScore = 20;

    let maxArchitecture = 0;
    let maxTasks = 0;
    let maxValidation = 0;
    let maxReview = 0;

    const affectedNodes = nodes.map((node) => {
      const depthPenalty = Math.pow(0.8, node.depth);
      let typeMultiplier = 1.0;
      
      if (node.type === "ARCHITECTURE") typeMultiplier = 1.2;
      else if (node.type === "TASK") typeMultiplier = 0.9;
      
      const score = Math.min(100, Math.max(0, Math.round(baseScore * depthPenalty * typeMultiplier)));
      
      // Aggregate maximums by category
      if (node.type === "ARCHITECTURE" && score > maxArchitecture) maxArchitecture = score;
      if (node.type === "TASK" && score > maxTasks) maxTasks = score;
      if (node.type === "VALIDATION" && score > maxValidation) maxValidation = score;
      if (node.type === "REVIEW" && score > maxReview) maxReview = score;
      
      return {
        ...node,
        score,
      };
    });

    affectedNodes.sort((a, b) => b.score - a.score);

    const getLabel = (score: number) => {
      if (score >= 80) return "Critical";
      if (score >= 50) return "High";
      if (score >= 20) return "Medium";
      if (score > 0) return "Low";
      return "None";
    };

    const categorizedImpact: CategorizedImpact = {
      overall: affectedNodes.length > 0 ? affectedNodes[0].score : 0,
      categories: {
        architecture: { score: maxArchitecture, label: getLabel(maxArchitecture) },
        tasks: { score: maxTasks, label: getLabel(maxTasks) },
        validation: { score: maxValidation, label: getLabel(maxValidation) },
        review: { score: maxReview, label: getLabel(maxReview) },
      }
    };

    return {
      memoryId,
      categorizedImpact,
      affectedNodes,
    };
  }
}
