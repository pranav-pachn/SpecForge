import { ContextProvider } from "./ContextProvider";
import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextPolicy } from "../interfaces/ContextPolicy";
import { ContextItem } from "../interfaces/RetrievedContext";
import { db } from "../../storage/db";
import { DecisionRetriever } from "../../memory/retrieval/DecisionRetriever";

export class MemoryProvider implements ContextProvider {
  readonly name = "MEMORY";

  supports(request: ContextRequest, policy: ContextPolicy): boolean {
    return policy.sources.includes(this.name);
  }

  async retrieve(request: ContextRequest, policy: ContextPolicy): Promise<ContextItem[]> {
    if (!request.workflowId) return [];

    const query = request.query || "engineering architecture decision";
    
    // Use the hybrid decision retriever from Phase 6
    const items = await DecisionRetriever.retrieveForWorkflow(request.workflowId, query, 10);
    
    // Map the returned provider string to this provider's name to comply with interface
    return items.map(item => ({
      ...item,
      source: this.name,
      provider: "MEMORY",
      retrievalMethod: "DecisionRetriever (Hybrid)"
    }));
  }
}

export const memoryProvider = new MemoryProvider();
