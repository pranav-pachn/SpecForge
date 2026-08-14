import { AdvisorRecommendation, ReasoningReport, NormalizedChange } from "./interfaces";
import { aiGateway } from "../ai/AIGateway";

export class RecommendationEngine {
  static async recommend(
    change: NormalizedChange,
    reasoning: ReasoningReport
  ): Promise<AdvisorRecommendation> {
    
    const prompt = `
You are the final decision-maker for an AI Engineering System.
Based on the following tradeoff reasoning report for a change request, make a final recommendation.

# CHANGE REQUEST
${JSON.stringify(change)}

# REASONING REPORT
${JSON.stringify(reasoning)}

# INSTRUCTIONS
Output a JSON object matching this schema:
{
  "decision": "PROCEED" | "DELAY" | "REJECT" | "INVESTIGATE",
  "confidence": <number between 0 and 100>,
  "reasons": [
    "string"
  ],
  "alternatives": [
    { "name": "...", "description": "..." }
  ]
}
`;

    const response = await aiGateway.generate({
      capability: "REASONING",
      prompt
    });

    try {
      const content = response.text || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Default evidence confidence, we'll override this in the Orchestrator
        return {
          ...parsed,
          evidenceConfidence: { graph: 100, memory: 50, rag: 0, reasoning: 100 }
        } as AdvisorRecommendation;
      }
      throw new Error("No JSON found in response");
    } catch (e) {
      console.warn(`[RecommendationEngine] Failed to parse AI response: ${e}`);
      return {
        decision: "INVESTIGATE",
        confidence: 0,
        reasons: ["Recommendation engine parsing failed."],
        alternatives: [],
        evidenceConfidence: { graph: 0, memory: 0, rag: 0, reasoning: 0 }
      };
    }
  }
}
