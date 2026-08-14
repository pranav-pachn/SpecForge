import { ContextItem } from "@/platform/context/interfaces/RetrievedContext";

export class DecisionRetriever {
  static async retrieveForWorkflow(
    workflowId: string,
    query: string,
    limit: number = 5
  ): Promise<ContextItem[]> {
    console.log(`[DecisionRetriever] Decision models removed. Skipping retrieval.`);
    return [];
  }
}
