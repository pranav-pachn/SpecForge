import { MCPRequest } from "./interfaces/MCPRequest";
import { MCPResponse } from "./interfaces/MCPResponse";
import { MCPContext } from "./interfaces/MCPContext";
import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";
import { mcpRouter } from "./routing/MCPRouter";
import { MCPMiddleware } from "./execution/MCPMiddleware";
import { LoggingMiddleware } from "./execution/LoggingMiddleware";
import { PermissionMiddleware } from "./execution/PermissionMiddleware";
import { CacheMiddleware } from "./execution/CacheMiddleware";
import { RetryMiddleware } from "./execution/RetryMiddleware";
import { MCPExecutor } from "./execution/MCPExecutor";

export class MCPBroker {
  private pipeline: MCPMiddleware[] = [];

  constructor() {
    // Build pipeline: Logging -> Permission -> Cache -> Retry -> Executor
    this.pipeline = [
      new LoggingMiddleware(),
      new PermissionMiddleware(),
      new CacheMiddleware(),
      new RetryMiddleware(),
      new MCPExecutor()
    ];
  }

  /**
   * Used by Agent Runtime to execute capabilities with side-effects or direct returns.
   */
  async execute(request: MCPRequest, callerPermissions: string[] = ["READ", "WRITE", "EXECUTE"]): Promise<MCPResponse> {
    const context = await this.buildContext(request, callerPermissions);
    return this.runPipeline(context);
  }

  /**
   * Used by Context Layer to search and retrieve context items.
   */
  async search(request: MCPRequest, callerPermissions: string[] = ["READ"]): Promise<ContextItem[]> {
    // Only search/read allowed for context retrieval
    const context = await this.buildContext(request, callerPermissions);
    const response = await this.runPipeline(context);
    return response.result as ContextItem[];
  }

  private async buildContext(request: MCPRequest, permissions: string[]): Promise<MCPContext> {
    const connector = await mcpRouter.route(request.capability);
    
    if (!connector) {
      throw new Error(`[MCPBroker] No available connector found for capability ${request.capability}`);
    }

    return {
      request,
      connector,
      permissions,
      metadata: {},
      traceId: request.id || crypto.randomUUID(),
      retryCount: 0,
      startedAt: new Date()
    };
  }

  private async runPipeline(context: MCPContext): Promise<MCPResponse> {
    let index = 0;

    const next = async (ctx: MCPContext): Promise<MCPResponse> => {
      if (index < this.pipeline.length) {
        const middleware = this.pipeline[index++];
        return await middleware.handle(ctx, next);
      }
      throw new Error("[MCPBroker] Pipeline exhausted without returning a response.");
    };

    return await next(context);
  }
}

export const mcpBroker = new MCPBroker();
