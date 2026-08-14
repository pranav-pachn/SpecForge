import { ContextMiddleware, ContextPipelineContext, NextPipelineFunction } from "./ContextPipeline";

export class RankingMiddleware implements ContextMiddleware {
  async handle(context: ContextPipelineContext, next: NextPipelineFunction): Promise<void> {
    // If the policy asks for reranking, we could use an external service (like Cohere Rerank) here.
    // For now, we sort locally using a combination of score, confidence, freshness, and priority.
    
    const policyPriorities = context.policy.priority || [];

    context.result.items.sort((a, b) => {
      // 1. Policy priority (e.g. Memory > RAG)
      const aPriorityIdx = policyPriorities.indexOf(a.source);
      const bPriorityIdx = policyPriorities.indexOf(b.source);
      
      const aPriorityScore = aPriorityIdx === -1 ? 99 : aPriorityIdx;
      const bPriorityScore = bPriorityIdx === -1 ? 99 : bPriorityIdx;

      if (aPriorityScore !== bPriorityScore) {
        return aPriorityScore - bPriorityScore; // Lower index is better
      }

      // 2. Confidence
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      // 3. Relevance Score
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      // 4. Freshness
      return b.freshness - a.freshness;
    });

    await next(context);
  }
}
