import { ContextRequest } from "./interfaces/ContextRequest";
import { ContextPolicy } from "./interfaces/ContextPolicy";
import { RetrievedContext } from "./interfaces/RetrievedContext";
import { ContextPipeline } from "./middleware/ContextPipeline";
import { RetrievalMiddleware } from "./middleware/RetrievalMiddleware";
import { DeduplicationMiddleware } from "./middleware/DeduplicationMiddleware";
import { RankingMiddleware } from "./middleware/RankingMiddleware";
import { CompressionMiddleware } from "./middleware/CompressionMiddleware";
import { BudgetMiddleware } from "./middleware/BudgetMiddleware";
import { ContextProvider } from "./providers/ContextProvider";

export class ContextBuilder {
  private pipeline: ContextPipeline;
  private providers: ContextProvider[] = [];

  constructor() {
    this.pipeline = new ContextPipeline();
  }

  /**
   * Register a new ContextProvider (e.g. RAGProvider, MemoryProvider)
   */
  registerProvider(provider: ContextProvider) {
    this.providers.push(provider);
  }

  /**
   * Initializes the pipeline. Must be called after all providers are registered.
   */
  init() {
    this.pipeline.use(new RetrievalMiddleware(this.providers));
    this.pipeline.use(new DeduplicationMiddleware());
    this.pipeline.use(new RankingMiddleware());
    this.pipeline.use(new CompressionMiddleware());
    this.pipeline.use(new BudgetMiddleware());
  }

  /**
   * Build the context by executing the pipeline.
   */
  async build(request: ContextRequest, policy: ContextPolicy): Promise<RetrievedContext> {
    return this.pipeline.execute(request, policy);
  }
}
