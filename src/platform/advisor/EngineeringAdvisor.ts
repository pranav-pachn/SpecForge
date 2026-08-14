import { ChangeAnalyzer } from "./ChangeAnalyzer";
import { ImpactAnalyzer } from "./ImpactAnalyzer";
import { ReasoningEngine } from "./ReasoningEngine";
import { RecommendationEngine } from "./RecommendationEngine";
import { AdvisorRecommendation, NormalizedChange } from "./interfaces";
import { contextLayer } from "../context/ContextLayer";
import { PlatformEventBus } from "../events/PlatformEventBus";

export class EngineeringAdvisor {
  static async evaluateChange(rawRequest: string, workflowId: string): Promise<{
    change: NormalizedChange,
    impact: any,
    reasoning: any,
    recommendation: AdvisorRecommendation
  }> {
    console.log(`[EngineeringAdvisor] Evaluating change request: ${rawRequest}`);
    
    // Emit start event
    PlatformEventBus.emit("DECISION_CREATED", {
      timestamp: new Date(),
      entityType: "ADVISORY_SESSION",
      entityId: workflowId,
      workflowId,
      metadata: { request: rawRequest }
    });

    // 1. Change Analyzer
    const change = await ChangeAnalyzer.analyze(rawRequest, workflowId);
    console.log(`[EngineeringAdvisor] Normalized Change:`, change);

    // 2. Impact Analyzer
    const impact = await ImpactAnalyzer.analyze(change);
    console.log(`[EngineeringAdvisor] Impact found ${impact.totalNodes} affected nodes.`);

    // 3. Context Layer (Memory, RAG, Graph)
    // Create a rich query for the Context Layer using the normalized change
    const contextQuery = `${change.operation} ${change.source} ${change.target ? 'to ' + change.target : ''}`;
    const context = await contextLayer.build({
      query: contextQuery,
      workflowId,
      capability: "REASONING" as any,
    });

    const providerResults = context.providerResults || {};
    const contextBundle = {
      memory: providerResults["ENGINEERING_MEMORY"] || [],
      graph: providerResults["KNOWLEDGE_GRAPH"] || [],
      rag: providerResults["RAG"] || []
    };

    // 4. Reasoning Engine
    const reasoning = await ReasoningEngine.evaluate(change, impact, contextBundle);

    // 5. Recommendation Engine
    const recommendation = await RecommendationEngine.recommend(change, reasoning);

    // Calculate evidence confidence based on context availability
    const hasMemory = contextBundle.memory.length > 0;
    const hasGraph = contextBundle.graph.length > 0;
    const hasRag = contextBundle.rag.length > 0;

    recommendation.evidenceConfidence = {
      graph: hasGraph ? 100 : 0,
      memory: hasMemory ? Math.min(100, contextBundle.memory.length * 30) : 0, // Heuristic
      rag: hasRag ? 80 : 0,
      reasoning: 90
    };

    // Calculate decision factors (like SHAP values)
    // We mock this slightly based on context weight, but a true multi-agent could score this dynamically
    recommendation.decisionFactors = {
      graph: hasGraph ? 0.38 : 0.10,
      memory: hasMemory ? 0.27 : 0.05,
      documentation: hasRag ? 0.14 : 0.05,
      reasoning: 0.21
    };
    
    // Normalize to 1.0 just in case
    const factorSum = recommendation.decisionFactors.graph + recommendation.decisionFactors.memory + recommendation.decisionFactors.documentation + recommendation.decisionFactors.reasoning;
    recommendation.decisionFactors.graph /= factorSum;
    recommendation.decisionFactors.memory /= factorSum;
    recommendation.decisionFactors.documentation /= factorSum;
    recommendation.decisionFactors.reasoning /= factorSum;

    console.log(`[EngineeringAdvisor] Final Recommendation: ${recommendation.decision} (${recommendation.confidence}%)`);

    // Persist to database for Continuous Learning (Phase 17)
    try {
      // Need Prisma Client here
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.advisorSession.create({
        data: {
          workflowId,
          changeRequest: rawRequest,
          recommendation: recommendation.decision,
          confidence: recommendation.confidence
        }
      });
      await prisma.$disconnect();
    } catch (e) {
      console.warn("[EngineeringAdvisor] Failed to persist AdvisorSession:", e);
    }

    // Emit complete event
    PlatformEventBus.emit("DECISION_CREATED", {
      timestamp: new Date(),
      entityType: "ADVISORY_SESSION_COMPLETED",
      entityId: workflowId,
      workflowId,
      metadata: { decision: recommendation.decision, confidence: recommendation.confidence, factors: recommendation.decisionFactors }
    });

    return {
      change,
      impact,
      reasoning,
      recommendation
    };
  }
}
