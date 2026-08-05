import { z } from "zod";

export const TemplateConfigSchema = z.object({
  stages: z.array(z.string()).min(1),
  policies: z.array(z.string()).optional(),
  approvals: z.array(z.object({
    role: z.string(),
    minApprovers: z.number().int().min(1).default(1)
  })).optional(),
  artifacts: z.array(z.object({
    type: z.string(),
    required: z.boolean().default(true)
  })).optional(),
  aiAgents: z.array(z.string()).optional(),
  defaults: z.record(z.string(), z.any()).optional()
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
