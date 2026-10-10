import { gateway } from "@/ai/gateway/gateway";
import type { CreateReviewRequest } from "@/shared/schemas/review";
import { assembleReview, ReviewModelInvalid, type AssembledReview } from "./assembleReview";
import { CODE_REVIEW_SYSTEM_PROMPT, ModelReviewSchema } from "./modelSchema";

function failureReason(error: unknown): string {
  const message = error instanceof Error ? error.message : "Provider request failed";
  const redacted = message.replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").replace(/\s+/g, " ").trim();
  return redacted.slice(0, 200) || "Provider request failed";
}

export interface ReviewAnalysis extends AssembledReview {
  status: "COMPLETED" | "FAILED" | "INCOMPLETE";
  provider: string | null;
  model: string | null;
  fallbackUsed: boolean;
}

export async function analyzeReview(input: CreateReviewRequest): Promise<ReviewAnalysis> {
  const prompt = [
    `Input kind: ${input.kind}`,
    input.language ? `Language: ${input.language}` : "",
    input.context ? `Context from the author:\n${input.context}` : "",
    "Submission:",
    input.content,
  ].filter(Boolean).join("\n\n");

  try {
    const response = await gateway.executeObject({
      capability: "code_review",
      system: CODE_REVIEW_SYSTEM_PROMPT,
      prompt,
      schema: ModelReviewSchema,
      temperature: 0,
    });
    const assembled = assembleReview(input, response.object);
    return {
      ...assembled,
      status: "COMPLETED",
      provider: response.provider ?? null,
      model: response.model ?? null,
      fallbackUsed: response.fallbackUsed ?? false,
    };
  } catch (error) {
    if (error instanceof ReviewModelInvalid) {
      return {
        summary: "The model response could not be validated.",
        findings: [],
        decision: { outcome: "INCOMPLETE", reasons: ["Model response failed schema validation"], blockingFindingFingerprints: [] },
        checks: [{ analyzer: "model", status: "ERROR", required: true, summary: "Response was not a valid review object." }],
        droppedFindings: 0,
        status: "INCOMPLETE",
        provider: null,
        model: null,
        fallbackUsed: false,
      };
    }
    const reason = failureReason(error);
    return {
      summary: "The review did not finish because the model provider failed.",
      findings: [],
      decision: { outcome: "INCOMPLETE", reasons: [reason], blockingFindingFingerprints: [] },
      checks: [{ analyzer: "provider", status: "ERROR", required: true, summary: reason }],
      droppedFindings: 0,
      status: "FAILED",
      provider: null,
      model: null,
      fallbackUsed: false,
    };
  }
}
