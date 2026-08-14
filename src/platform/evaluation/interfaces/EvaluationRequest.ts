import { Capability } from "../../ai/interfaces/Capability";
import { ContextItem, RetrievedContext } from "../../context/interfaces/RetrievedContext";

export interface EvaluationBundle {
  contextItems: ContextItem[];
  memory: any[]; // Or Decision[]
  graph: {
    coverageReport?: any;
    impactReport?: any;
    nodes?: any[];
  };
  rag: ContextItem[];
  mcp: ContextItem[];
  trace: RetrievedContext["trace"];
}

export interface EvaluationRequest {
  id: string; // Trace ID
  workflowId: string;
  capability: Capability;
  
  // Analytics Tracking (from Runtime/Gateway)
  traceId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  promptVersion?: string;

  artifact: {
    text: string;
    schema?: any; // Structured object if available
  };
  
  bundle: EvaluationBundle;
  
  metadata?: Record<string, unknown>;
}
