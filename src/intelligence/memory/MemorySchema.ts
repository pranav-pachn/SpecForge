import { z } from "zod";
import { MemoryType, MemoryStatus, MemorySeverity, MemoryCreatedBy } from "@prisma/client";

export const DecisionTraceSchema = z.object({
  title: z.string(),
  description: z.string().describe("What changed?"),
  reason: z.string().describe("Why did it change?"),
  affectedAreas: z.array(z.string()).describe("High-level areas impacted (e.g. 'Architecture', 'Tasks', 'Validation')"),
  confidenceScore: z.number().min(0).max(1).describe("AI confidence 0.0-1.0"),
  confidenceSources: z.array(z.object({
    signal: z.string(),
    weight: z.number(),
  })).describe("Signals contributing to confidence"),
});

export type DecisionTrace = z.infer<typeof DecisionTraceSchema>;

export interface MemoryContextData {
  highImpactChanges: string[];
  recentDecisions: string[];
  activeRisks: string[];
  resolvedReviews: string[];
}

export interface CategorizedImpact {
  overall: number;
  categories: {
    architecture: { score: number; label: "Critical" | "High" | "Medium" | "Low" | "None" };
    tasks:        { score: number; label: "Critical" | "High" | "Medium" | "Low" | "None" };
    validation:   { score: number; label: "Critical" | "High" | "Medium" | "Low" | "None" };
    review:       { score: number; label: "Critical" | "High" | "Medium" | "Low" | "None" };
  };
}

export interface ImpactAnalysis {
  memoryId: string;
  categorizedImpact: CategorizedImpact;
  affectedNodes: Array<{
    type: string;
    id: string;
    title: string;
    score: number;
    path: string[];
  }>;
}
