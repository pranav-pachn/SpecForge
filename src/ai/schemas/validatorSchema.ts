import { z } from 'zod';

export const ValidatorExplanationSchema = z.object({
  issueId: z.string(),
  explanation: z.string(),
  recommendation: z.string()
});

export const ValidatorOutputSchema = z.object({
  explanations: z.array(ValidatorExplanationSchema),
});

export type ValidatorOutput = z.infer<typeof ValidatorOutputSchema>;
