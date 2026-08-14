import { EvaluationRequest } from "./EvaluationRequest";
import { EvaluationResult } from "./EvaluationResult";
import { Capability } from "../../ai/interfaces/Capability";

export interface Evaluator {
  id: string;
  name: string;
  category: "STRUCTURAL" | "SEMANTIC" | "OPERATIONAL";
  weight: number; // For aggregation
  
  supportsCapability(capability: Capability): boolean;
  evaluate(request: EvaluationRequest): Promise<EvaluationResult>;
}
