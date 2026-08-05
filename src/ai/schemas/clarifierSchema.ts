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
      traceability: TraceabilitySchema
    })
  ),
  confidenceScore: z.number().min(0).max(100)
});

export type ClarifierOutput = z.infer<typeof ClarifierOutputSchema>;
