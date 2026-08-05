import { z } from 'zod';

export const TraceabilitySchema = z.object({
  derivedFrom: z.string().describe("Source requirement, task, or raw idea text"),
  reason: z.string().describe("Why this item was created or suggested"),
  confidence: z.number().min(0).max(100).describe("Confidence score of this generation"),
});
