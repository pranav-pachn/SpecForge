import { z } from 'zod';
import { TraceabilitySchema } from './common';

export const ReviewIssueSchema = z.object({
  finding: z.string(),
  suggestion: z.string(),
  risk: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  generateFix: z.boolean().describe("Whether this can be auto-fixed by AI"),
  traceability: TraceabilitySchema
});

export const ReviewCategoryResultSchema = z.object({
  score: z.number().min(0).max(100),
  items: z.array(
    z.object({
      status: z.enum(["pass", "warn", "fail"]),
      label: z.string(),
      detail: z.string(),
      issue: ReviewIssueSchema.optional()
    })
  )
});

export const ReviewerOutputSchema = z.object({
  categories: z.object({
    coverage: ReviewCategoryResultSchema,
    testing: ReviewCategoryResultSchema,
    security: ReviewCategoryResultSchema,
    performance: ReviewCategoryResultSchema,
    architecture: ReviewCategoryResultSchema,
    deployment: ReviewCategoryResultSchema,
    rollback: ReviewCategoryResultSchema
  }),
  overallScore: z.number().min(0).max(100)
});

export type ReviewerOutput = z.infer<typeof ReviewerOutputSchema>;
