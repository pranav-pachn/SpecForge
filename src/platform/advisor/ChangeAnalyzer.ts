import { NormalizedChange } from "./interfaces";
import { aiGateway } from "../ai/AIGateway";

export class ChangeAnalyzer {
  static async analyze(rawRequest: string, workflowId: string): Promise<NormalizedChange> {
    const prompt = `
Normalize the following engineering change request into a structured JSON format.

Request: "${rawRequest}"

Output JSON strictly adhering to this interface:
{
  "operation": "ADD" | "REMOVE" | "UPDATE" | "REPLACE" | "RENAME" | "MOVE",
  "source": "Name of the primary entity",
  "target": "Name of the target entity (only if REPLACE or MOVE)",
  "entityType": "A broad category like DATABASE, API, SERVICE, COMPONENT, LIBRARY"
}
`;
    
    // We can use the 'REASONING' capability or 'CLARIFY'
    const response = await aiGateway.generate({
      capability: "REASONING",
      prompt,
      // Forcing JSON response
    });

    try {
      // Basic extraction of JSON block
      const content = response.text || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as NormalizedChange;
      }
      throw new Error("No JSON found in response");
    } catch (e) {
      console.warn(`[ChangeAnalyzer] Failed to parse AI response as JSON: ${e}`);
      // Fallback
      return {
        operation: "UPDATE",
        source: rawRequest,
        entityType: "UNKNOWN"
      };
    }
  }
}
