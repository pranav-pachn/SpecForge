import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.union([z.string(), z.array(z.string())]),
  verificationNotes: z.union([z.string(), z.array(z.string())]),
  priority: z.number(),
  order: z.number(),
  complexity: z.enum(["XS", "S", "M", "L", "XL"]),
  dependencies: z.array(z.string()),
  requirements: z.array(z.string()),
  traceability: TraceabilitySchema
});

export const TaskPlannerOutputSchema = z.object({
  tasks: z.array(TaskSchema)
});

export type TaskPlannerOutput = z.infer<typeof TaskPlannerOutputSchema>;
