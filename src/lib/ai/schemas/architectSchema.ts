import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const ArchitectOutputSchema = z.object({
  modules: z.array(
    z.object({
      name: z.string(),
      responsibility: z.string(),
      dependencies: z.array(z.string()),
      traceability: TraceabilitySchema
    })
  ),
  services: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      tech: z.string(),
      traceability: TraceabilitySchema
    })
  ),
  entities: z.array(
    z.object({
      name: z.string(),
      fields: z.array(z.string()),
      relations: z.array(z.string()),
      traceability: TraceabilitySchema
    })
  ),
  apis: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      request: z.string(),
      response: z.string(),
      traceability: TraceabilitySchema
    })
  ),
  database: z.object({
    tables: z.array(z.string()),
    indexes: z.array(z.string()),
    notes: z.string(),
  }),
  externalIntegrations: z.array(z.string()),
  architectureDiagram: z.string().describe("Mermaid flowchart string"),
});

export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;
