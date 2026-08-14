import { aiGateway } from "@/platform/ai/AIGateway";
import { ExtractionResult, ExtractionResultSchema } from "../interfaces/ExtractionResult";

export class DecisionExtractor {
  static async extract(
    artifactType: string,
    oldContent: string | null,
    newContent: string,
    deterministicDetails?: { title: string; description: string; reason: string }
  ): Promise<ExtractionResult> {
    
    if (deterministicDetails) {
      return {
        title: deterministicDetails.title,
        summary: deterministicDetails.description,
        reason: deterministicDetails.reason,
        assumptions: [],
        constraints: [],
        confidence: 1.0,
        alternatives: [],
        tradeoffs: [],
        risks: [],
        outcomes: []
      };
    }

    const system = `You are an expert Engineering Architect analyzing changes to a software project artifact.
Your goal is to extract a structured Decision Record explaining WHAT changed, WHY it changed, alternatives considered, tradeoffs made, and risks accepted.
Artifact Type: ${artifactType}`;

    const prompt = `Please analyze the following artifact change.

--- OLD CONTENT ---
${oldContent ? oldContent.substring(0, 4000) + (oldContent.length > 4000 ? "...\n[TRUNCATED]" : "") : "(None - Initial Creation)"}

--- NEW CONTENT ---
${newContent.substring(0, 4000) + (newContent.length > 4000 ? "...\n[TRUNCATED]" : "")}

Extract a highly structured Engineering Decision from this change. Include confidence (0.0 to 0.85 for AI extractions).`;

    try {
      const response = await aiGateway.generateObject<ExtractionResult>({
        capability: "REVIEW",
        system,
        prompt,
        schema: ExtractionResultSchema,
        temperature: 0.1,
      });

      // Cap AI confidence at 0.85 per rules
      const result = response.object;
      if (!result) throw new Error("AI returned undefined object");
      
      result.confidence = Math.min(result.confidence, 0.85);
      return result;
    } catch (error) {
      console.error("[DecisionExtractor] Failed to extract decision with AI", error);
      // Fallback
      return {
        title: `${artifactType} Updated`,
        summary: "Artifact content was modified.",
        reason: "Unknown (AI generation failed)",
        assumptions: [],
        constraints: [],
        confidence: 0.5,
        alternatives: [],
        tradeoffs: [],
        risks: [],
        outcomes: []
      };
    }
  }
}
