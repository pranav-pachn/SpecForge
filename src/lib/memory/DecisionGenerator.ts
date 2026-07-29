import { gateway } from "../ai/gateway/gateway";
import { DecisionTrace, DecisionTraceSchema } from "./MemorySchema";
import { ChangeDetection } from "./DecisionDetector";

export class DecisionGenerator {
  static async generate(
    artifactType: string,
    oldContent: string | null,
    newContent: string,
    detection: ChangeDetection
  ): Promise<DecisionTrace> {
    // If deterministic details exist, bypass LLM
    if (detection.deterministicDetails) {
      return {
        title: detection.deterministicDetails.title,
        description: detection.deterministicDetails.description,
        reason: detection.deterministicDetails.reason,
        affectedAreas: ["Workflow Dependencies"],
        confidenceScore: 1.0,
        confidenceSources: [{ signal: "Deterministic tracking", weight: 1.0 }],
      };
    }

    // Otherwise, generate with AI
    const system = `You are an expert Engineering Architect analyzing changes to a software project artifact.
Your goal is to explain WHAT changed, WHY it changed, and WHAT it impacts.
Artifact Type: ${artifactType}`;

    const prompt = `Please analyze the following artifact change.

--- OLD CONTENT ---
${oldContent ? oldContent.substring(0, 4000) + (oldContent.length > 4000 ? "...\n[TRUNCATED]" : "") : "(None - Initial Creation)"}

--- NEW CONTENT ---
${newContent.substring(0, 4000) + (newContent.length > 4000 ? "...\n[TRUNCATED]" : "")}

Generate a concise Decision Trace explaining this change. Include a confidence score (0.0 to 1.0) and explain your confidence using specific signals and weights.`;

    try {
      const response = await gateway.executeObject<DecisionTrace>({
        capability: "review",
        system,
        prompt,
        schema: DecisionTraceSchema,
        temperature: 0.1,
      });
      return response.object;
    } catch (error) {
      console.error("[DecisionGenerator] Failed to generate memory with AI", error);
      // Fallback
      return {
        title: `${artifactType} Updated`,
        description: "Artifact content was modified.",
        reason: "Unknown (AI generation failed)",
        affectedAreas: [],
        confidenceScore: 0.5,
        confidenceSources: [{ signal: "Fallback generation", weight: 1.0 }],
      };
    }
  }
}
