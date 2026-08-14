import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const ClarifierOutputSchema = z.object({
  assumptions: z.array(
    z.object({
      assumption: z.string(),
      traceability: TraceabilitySchema
    })
  ),
  questions: z.array(
    z.object({
      question: z.string(),
      category: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().optional()
      })).optional(),
      rationale: z.string().optional(),
      impact: z.record(z.string(), z.boolean()).optional(),
      traceability: TraceabilitySchema
    })
  ),
  confidenceScore: z.number().min(0).max(100),
  ambiguityScore: z.number().min(0).max(100).optional(),
});

export type ClarifierOutput = z.infer<typeof ClarifierOutputSchema>;
