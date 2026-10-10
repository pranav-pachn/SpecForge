import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const SpecRequirementSchema = z.object({
  id: z.string().regex(/^REQ-\d+$/),
  text: z.string(),
  kind: z.enum(["MUST", "SHOULD", "OPTIONAL", "ASSUMPTION"]),
  source: z.enum(["EXPLICIT", "INFERRED", "CLARIFIED"]),
});

export const SpecificationOutputSchema = z.object({
  markdown: z.string(),
  requirements: z.array(SpecRequirementSchema).optional(),
  sections: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      traceability: TraceabilitySchema
    })
  )
});

export type SpecificationOutput = z.infer<typeof SpecificationOutputSchema>;
