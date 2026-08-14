import { ContextMiddleware, ContextPipelineContext, NextPipelineFunction } from "./ContextPipeline";
import { ContextProvider } from "../providers/ContextProvider";

export class RetrievalMiddleware implements ContextMiddleware {
  constructor(private providers: ContextProvider[]) {}

  async handle(context: ContextPipelineContext, next: NextPipelineFunction): Promise<void> {
    const providerResults: Record<string, any[]> = {};
    const providerLatencies: Record<string, number> = {};
    const providersUsed: string[] = [];

    const promises = this.providers
      .filter(p => p.supports(context.request, context.policy))
      .map(async p => {
        const start = Date.now();
        const items = await p.retrieve(context.request, context.policy);
        const duration = Date.now() - start;
        
        providerResults[p.name] = items;
        providerLatencies[p.name] = duration;
        providersUsed.push(p.name);
        
        return items;
      });
    
    const startOverall = Date.now();
    const results = await Promise.all(promises);
    const retrievalTime = Date.now() - startOverall;
    
    // Flatten all retrieved items into the result
    context.result.items = results.flat();
    context.result.providerResults = providerResults;
    
    if (!context.result.trace) {
      context.result.trace = {
        retrievalTime: 0,
        providerLatencies: {},
        providersUsed: [],
        droppedItems: 0,
        retrieved: 0,
        filtered: 0,
        compressed: 0,
        dropped: 0,
        finalTokens: 0
      };
    }
    
    context.result.trace!.retrievalTime = retrievalTime;
    context.result.trace!.providerLatencies = providerLatencies;
    context.result.trace!.providersUsed = providersUsed;
    
    // Keep legacy trace compatibility if needed
    (context.result as any).trace.retrieved = context.result.items.length;
    
    await next(context);
  }
}
