import { ContextProvider } from "./ContextProvider";
import { ContextRequest } from "../interfaces/ContextRequest";
import { ContextPolicy } from "../interfaces/ContextPolicy";
import { ContextItem } from "../interfaces/RetrievedContext";

export class GraphProvider implements ContextProvider {
  readonly name = "KNOWLEDGE_GRAPH";

  supports(request: ContextRequest, policy: ContextPolicy): boolean {
    return policy.sources.includes(this.name);
  }

  async retrieve(request: ContextRequest, policy: ContextPolicy): Promise<ContextItem[]> {
    console.log(`[GraphProvider] GraphNode models removed. Returning empty context.`);
    return [];
  }
}

export const graphProvider = new GraphProvider();
