import { ContextMiddleware, ContextPipelineContext, NextPipelineFunction } from "./ContextPipeline";

export class BudgetMiddleware implements ContextMiddleware {
  async handle(context: ContextPipelineContext, next: NextPipelineFunction): Promise<void> {
    const budget = context.policy.budget;
    let currentTokens = 0;
    const budgetedItems = [];
    let trimmed = false;

    for (const item of context.result.items) {
      // Fast heuristic: ~4 characters per token
      const tokenEstimate = Math.ceil(item.content.length / 4);
      
      if (currentTokens + tokenEstimate <= budget) {
        budgetedItems.push(item);
        currentTokens += tokenEstimate;
      } else {
        trimmed = true;
        // Since items are already ranked, we just drop the rest
        break;
      }
    }

    context.result.trace!.dropped += context.result.items.length - budgetedItems.length;
    context.result.trace!.finalTokens = currentTokens;
    context.result.items = budgetedItems;
    context.result.totalTokens = currentTokens;
    context.result.wasTrimmed = trimmed;

    await next(context);
  }
}
