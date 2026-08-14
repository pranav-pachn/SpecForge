import { EvaluationResult, EvaluationFinding } from "../interfaces/EvaluationResult";
import { EvaluatorRegistry } from "../registry/EvaluatorRegistry";

export class ConfidenceAggregator {
  constructor(private registry: EvaluatorRegistry) {}

  aggregate(results: EvaluationResult[]): {
    overall: number;
    passed: boolean;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    breakdown: Record<string, number>;
    recommendations: string[];
  } {
    if (results.length === 0) {
      return {
        overall: 0,
        passed: false,
        riskLevel: "CRITICAL",
        breakdown: {},
        recommendations: []
      };
    }

    let totalWeight = 0;
    let weightedScoreSum = 0;
    const breakdown: Record<string, number> = {};
    const allFindings: EvaluationFinding[] = [];
    const allRecommendations = new Set<string>();
    
    // Calculate base weighted score
    for (const result of results) {
      const evaluator = this.registry.get(result.evaluatorId);
      const weight = evaluator ? evaluator.weight : 1;

      totalWeight += weight;
      weightedScoreSum += (result.score * weight);
      breakdown[result.evaluatorId] = result.score;
      allFindings.push(...result.findings);
      
      for (const rec of result.recommendations) {
        allRecommendations.add(rec);
      }
    }

    let overall = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;

    // Determine highest severity finding for risk overrides
    let highestSeverityLevel = 0;
    const severityMap: Record<string, number> = {
      "INFO": 1,
      "WARN": 2,
      "ERROR": 3,
      "CRITICAL": 4
    };

    for (const finding of allFindings) {
      const level = severityMap[finding.severity] || 0;
      if (level > highestSeverityLevel) {
        highestSeverityLevel = level;
      }
    }

    // Risk override logic
    // If there is a CRITICAL finding, score cannot exceed 20 and risk is CRITICAL
    // If there is an ERROR finding, score cannot exceed 60 and risk is HIGH
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";

    if (highestSeverityLevel === 4) { // CRITICAL
      overall = Math.min(overall, 20);
      riskLevel = "CRITICAL";
    } else if (highestSeverityLevel === 3) { // ERROR
      overall = Math.min(overall, 60);
      riskLevel = "HIGH";
    } else if (highestSeverityLevel === 2) { // WARN
      riskLevel = overall < 70 ? "HIGH" : "MEDIUM";
    } else {
      riskLevel = overall < 70 ? "MEDIUM" : "LOW";
    }

    // Default threshold config could be injected, for now hardcode 80
    const passed = overall >= 80 && highestSeverityLevel < 3; // Cannot pass with ERROR or CRITICAL

    return {
      overall: Math.round(overall * 100) / 100,
      passed,
      riskLevel,
      breakdown,
      recommendations: Array.from(allRecommendations)
    };
  }
}
