import { NormalizedChange, ReasoningReport } from "./interfaces";
import { aiGateway } from "../ai/AIGateway";

export class ReasoningEngine {
  static async evaluate(
    change: NormalizedChange,
    impactReport: any,
    contextBundle: any
  ): Promise<ReasoningReport> {
    
    // We construct a massive reasoning prompt taking into account the impact graph and the memory context
    const prompt = `
You are an expert AI Software Architect. You are evaluating an engineering change request.

# CHANGE REQUEST
Operation: ${change.operation}
Source: ${change.source}
Target: ${change.target || "N/A"}
Entity Type: ${change.entityType}

# GRAPH IMPACT (Blast Radius)
Nodes Affected: ${impactReport.totalNodes}
Details: ${JSON.stringify(impactReport.nodes)}

# MEMORY & KNOWLEDGE CONTEXT
The following context was retrieved regarding past decisions and system architecture:
${JSON.stringify(contextBundle)}

# INSTRUCTIONS
Analyze the tradeoffs of making this change. Return a strictly formatted JSON object matching this schema:
{
  "tradeoffs": [
    { "benefit": "...", "cost": "..." }
  ],
  "risks": [
    "string"
  ],
  "impactSummary": "A concise summary of the architectural impact."
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
        return JSON.parse(jsonMatch[0]) as ReasoningReport;
      }
      throw new Error("No JSON found in response");
    } catch (e) {
      console.warn(`[ReasoningEngine] Failed to parse AI response as JSON: ${e}`);
      return {
        tradeoffs: [{ benefit: "Potential improvements", cost: "Unknown architectural costs" }],
        risks: ["Analysis failed to parse properly."],
        impactSummary: `Impacts ${impactReport.totalNodes} nodes.`
      };
    }
  }
}
