import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const SpecificationOutputSchema = z.object({
  markdown: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      traceability: TraceabilitySchema
    })
  )
});

export type SpecificationOutput = z.infer<typeof SpecificationOutputSchema>;
