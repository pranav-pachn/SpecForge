import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const PlannerOutputSchema = z.object({
  intent: z.string(),
  goals: z.array(z.string()),
  features: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      traceability: TraceabilitySchema
    })
  ),
  constraints: z.array(z.string()),
  risks: z.array(z.string()),
});

export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
