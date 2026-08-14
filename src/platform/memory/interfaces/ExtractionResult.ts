import { z } from "zod";

export const ExtractionResultSchema = z.object({
  title: z.string(),
  summary: z.string().describe("A concise summary of the decision"),
  reason: z.string().describe("Why was this decision made?"),
  assumptions: z.array(z.string()).describe("Any assumptions made when making this decision"),
  constraints: z.array(z.string()).describe("Any constraints that forced or limited this decision"),
  confidence: z.number().min(0).max(1).describe("AI confidence in this extraction"),
  alternatives: z.array(z.object({
    description: z.string(),
    accepted: z.boolean(),
    rejectionReason: z.string().optional()
  })),
  tradeoffs: z.array(z.object({
    benefit: z.string(),
    cost: z.string()
  })),
  risks: z.array(z.object({
    description: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    mitigation: z.string().optional()
  })),
  outcomes: z.array(z.object({
    description: z.string()
  })),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
