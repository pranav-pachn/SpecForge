import { Retriever } from "../retrieval/Retriever";
import { RetrievedNode } from "./Node";

export interface ContextProfile {
  capability: string;
  getTypes(): string[];
  format(nodes: RetrievedNode[]): string;
}

export class ContextBuilder {
  static async build(options: {
    profile: ContextProfile;
    workflowId: string;
    query: string;
  }): Promise<string> {
    const nodes = await Retriever.search({
      workflowId: options.workflowId,
      query: options.query,
      types: options.profile.getTypes(),
      limit: 10
    });

    const knowledgeStr = nodes.length > 0 ? options.profile.format(nodes) : "";

    // Inject Engineering Memory
    const { Timeline } = await import("@/intelligence/memory/Timeline");
    const memories = await Timeline.getWorkflowTimeline(options.workflowId);
    
    if (memories.length === 0) return knowledgeStr;

    const highImpact = memories.filter(m => m.severity === "HIGH" || m.severity === "CRITICAL").slice(0, 3);
    const recent = memories.slice(0, 5);
    
    let memoryStr = "\n\n## Engineering Decisions & Memory Context\n";
    if (highImpact.length > 0) {
      memoryStr += "\n### High Impact Changes\n";
      highImpact.forEach(m => {
        memoryStr += `- [${m.decisionId}] ${m.title}: ${m.reason}\n`;
      });
    }

    if (recent.length > 0) {
      memoryStr += "\n### Recent Decisions\n";
      recent.forEach(m => {
        memoryStr += `- [${m.decisionId}] ${m.title}\n`;
      });
    }

    return knowledgeStr + memoryStr;
  }
}
