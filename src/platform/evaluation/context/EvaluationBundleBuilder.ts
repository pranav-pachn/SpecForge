import { EvaluationBundle, EvaluationRequest } from "../interfaces/EvaluationRequest";
import { contextLayer } from "../../context/ContextLayer";
import { Capability } from "../../ai/interfaces/Capability";
import { GraphTraversalService } from "../../graph/GraphTraversalService";

export class EvaluationBundleBuilder {
  
  async build(params: {
    workflowId: string;
    capability: Capability;
    artifactText: string;
    agentId?: string;
  }): Promise<EvaluationRequest> {
    
    // 1. Ask Context Layer for context for this capability
    const retrieved = await contextLayer.build({
      query: "Evaluation context building",
      workflowId: params.workflowId,
      capability: params.capability as any, // Cast temporarily to match ContextLayer policies
      metadata: {
        evaluation: true
      }
    });

    const providerResults = retrieved.providerResults || {};

    // 2. Assemble the bundle from the raw Context Layer outputs
    // The memory provider returns ContextItems representing decisions
    const memoryItems = providerResults["ENGINEERING_MEMORY"] || [];
    
    // The graph provider returns ContextItems representing nodes
    const graphNodes = providerResults["KNOWLEDGE_GRAPH"] || [];
    
    // As the graph provider doesn't natively return Coverage/Impact metrics in the item list,
    // we fetch them separately to enrich the graph portion of the bundle if relevant.
    // In the future, GraphProvider could return a TraversalResult containing these.
    let coverageReport;
    let impactReport;
    
    if (params.capability === "TASK_PLANNING" || params.capability === "ARCHITECTURE") {
      try {
        coverageReport = await GraphTraversalService.findCoverage(params.workflowId);
        // Only run impact report if it's an architecture generated artifact
        if (params.capability === "ARCHITECTURE") {
          // Find root node ID for architecture if we can, else skip
          // For simplicity in evaluation, we might just look up the spec node
        }
      } catch (e) {
        console.warn("[EvaluationBundleBuilder] Failed to get graph metrics:", e);
      }
    }

    const bundle: EvaluationBundle = {
      contextItems: retrieved.items,
      memory: memoryItems,
      graph: {
        nodes: graphNodes,
        coverageReport,
        impactReport
      },
      rag: providerResults["RAG"] || [],
      mcp: providerResults["MCP"] || [],
      trace: retrieved.trace
    };

    return {
      id: crypto.randomUUID(),
      workflowId: params.workflowId,
      capability: params.capability,
      agentId: params.agentId,
      artifact: {
        text: params.artifactText
      },
      bundle
    };
  }
}

export const evaluationBundleBuilder = new EvaluationBundleBuilder();
