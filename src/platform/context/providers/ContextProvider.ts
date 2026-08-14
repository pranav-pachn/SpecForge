import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextItem } from "../interfaces/RetrievedContext";
import { ContextPolicy } from "../interfaces/ContextPolicy";

export interface ContextProvider {
  /** The unique name of the provider (e.g., 'RAG', 'MEMORY', 'MCP') */
  name: string;
  
  /** Return true if this provider can and should handle the request under the given policy */
  supports(request: ContextRequest, policy: ContextPolicy): boolean;
  
  /** Retrieve context items relevant to the request */
  retrieve(request: ContextRequest, policy: ContextPolicy): Promise<ContextItem[]>;
}
