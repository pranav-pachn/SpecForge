import { GatewayContext, GatewayMiddleware, NextFunction, NextStreamFunction } from "./GatewayMiddleware";
import { AIResponse, AIStreamChunk } from "../interfaces/AIResponse";

export class GatewayPipeline {
  private middlewares: GatewayMiddleware[] = [];

  use(middleware: GatewayMiddleware) {
    this.middlewares.push(middleware);
  }

  async execute(context: GatewayContext): Promise<AIResponse> {
    const run = async (index: number, ctx: GatewayContext): Promise<AIResponse> => {
      if (index >= this.middlewares.length) {
        throw new Error("Pipeline reached end without generating a response.");
      }
      const middleware = this.middlewares[index];
      return middleware.handle(ctx, (nextCtx) => run(index + 1, nextCtx));
    };

    return run(0, context);
  }

  async *executeStream(context: GatewayContext): AsyncIterable<AIStreamChunk> {
    const middlewares = this.middlewares;
    const runStream = async function* (index: number, ctx: GatewayContext): AsyncIterable<AIStreamChunk> {
      if (index >= middlewares.length) {
        throw new Error("Pipeline reached end without generating a stream.");
      }
      const middleware = middlewares[index];
      if (middleware.handleStream) {
        yield* middleware.handleStream(ctx, (nextCtx: GatewayContext) => runStream(index + 1, nextCtx));
      } else {
        // If a middleware doesn't support streaming, we just pass through to the next
        yield* runStream(index + 1, ctx);
      }
    };

    yield* runStream(0, context);
  }
}
