import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextPolicy } from "../interfaces/ContextPolicy";
import { RetrievedContext } from "../interfaces/RetrievedContext";

export interface ContextPipelineContext {
  request: ContextRequest;
  policy: ContextPolicy;
  result: RetrievedContext;
}

export type NextPipelineFunction = (context: ContextPipelineContext) => Promise<void>;

export interface ContextMiddleware {
  handle(context: ContextPipelineContext, next: NextPipelineFunction): Promise<void>;
}

export class ContextPipeline {
  private middlewares: ContextMiddleware[] = [];

  use(middleware: ContextMiddleware) {
    this.middlewares.push(middleware);
  }

  async execute(request: ContextRequest, policy: ContextPolicy): Promise<RetrievedContext> {
    const context: ContextPipelineContext = {
      request,
      policy,
      result: { 
        items: [], 
        totalTokens: 0, 
        wasTrimmed: false,
        trace: { 
          retrievalTime: 0, providerLatencies: {}, providersUsed: [], droppedItems: 0,
          retrieved: 0, filtered: 0, compressed: 0, dropped: 0, finalTokens: 0 
        }
      }
    };

    const run = async (index: number, ctx: ContextPipelineContext): Promise<void> => {
      if (index >= this.middlewares.length) return;
      const middleware = this.middlewares[index];
      await middleware.handle(ctx, (nextCtx) => run(index + 1, nextCtx));
    };

    await run(0, context);
    return context.result;
  }
}
