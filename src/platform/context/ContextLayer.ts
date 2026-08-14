import { ContextRequest } from "./interfaces/ContextRequest";
import { RetrievedContext } from "./interfaces/RetrievedContext";
import { ContextPolicy } from "./interfaces/ContextPolicy";
import { ContextBuilder } from "./ContextBuilder";
import { ragProvider } from "./providers/RAGProvider";
import { memoryProvider } from "./providers/MemoryProvider";
import { graphProvider } from "./providers/GraphProvider";
import { mcpProvider } from "./providers/MCPProvider";
import { contextCache } from "./cache/ContextCache";

// Define some standard policies. In a full system, these could be loaded from config.
const DEFAULT_POLICIES: Record<string, ContextPolicy> = {
  SPECIFICATION: {
    sources: ["RAG"],
    budget: 8000,
    priority: ["RAG"],
    compression: false,
    reranking: true
  },
  ARCHITECTURE: {
    sources: ["RAG", "MEMORY", "KNOWLEDGE_GRAPH", "MCP"],
    budget: 12000,
    priority: ["MEMORY", "KNOWLEDGE_GRAPH", "MCP", "RAG"],
    compression: true,
    reranking: true
  },
  DEFAULT: {
    sources: ["RAG", "MEMORY", "KNOWLEDGE_GRAPH", "MCP"],
    budget: 6000,
    priority: ["MEMORY", "KNOWLEDGE_GRAPH", "MCP", "RAG"],
    compression: true,
    reranking: true
  }
};

export class ContextLayer {
  private builder: ContextBuilder;

  constructor() {
    this.builder = new ContextBuilder();
    
    // Register Sprint 5A, 5B & 5C Providers
    this.builder.registerProvider(ragProvider);
    this.builder.registerProvider(memoryProvider);
    this.builder.registerProvider(graphProvider);
    this.builder.registerProvider(mcpProvider);
    
    // Initialize the pipeline
    this.builder.init();
  }

  async build(request: ContextRequest): Promise<RetrievedContext> {
    const policy = DEFAULT_POLICIES[request.capability] || DEFAULT_POLICIES["DEFAULT"];
    
    // Check Cache First
    const cached = contextCache.get(request);
    if (cached) {
      return cached;
    }

    // The builder runs the request through the pipeline:
    // Retrieval -> Deduplication -> Ranking -> Compression -> Budgeting
    const context = await this.builder.build(request, policy);
    
    // Cache the result for subsequent agent queries in the same workflow/session
    contextCache.set(request, context);

    return context;
  }
}

export const contextLayer = new ContextLayer();
