import { ContextProvider } from "./ContextProvider";
import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextPolicy } from "../interfaces/ContextPolicy";
import { ContextItem } from "../interfaces/RetrievedContext";
import { retriever } from "../rag/Retriever";

export class RAGProvider implements ContextProvider {
  readonly name = "RAG";

  supports(request: ContextRequest, policy: ContextPolicy): boolean {
    // Check if the policy explicitly allows RAG
    return policy.sources.includes(this.name);
  }

  async retrieve(request: ContextRequest, policy: ContextPolicy): Promise<ContextItem[]> {
    return retriever.retrieve(request.query, request.workflowId, policy);
  }
}

export const ragProvider = new RAGProvider();
