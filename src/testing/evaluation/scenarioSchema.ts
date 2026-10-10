import { z } from "zod";

export const ExpectedRequirementSchema = z.object({
  id: z.string().regex(/^REQ-\d+$/),
  keywords: z.array(z.string()).min(1),
  kind: z.enum(["MUST", "SHOULD", "OPTIONAL", "PREFERENCE", "UNCERTAIN", "FUTURE"]),
  securityRelevant: z.boolean().default(false),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  humanReviewed: z.boolean(),
  input: z.object({
    rawIdea: z.string().min(1),
  }),
  expectedRequirements: z.array(ExpectedRequirementSchema).min(1),
  requiredOutputs: z.array(z.enum(["specification", "acceptanceCriteria", "architecture", "tasks", "dependencies", "tests", "clarification", "drift"])),
  forbiddenOutcomes: z.array(z.string()),
  securityCases: z.array(z.string()),
  negativeCases: z.array(z.string()),
  clarification: z.object({
    mustAskAbout: z.array(z.string()),
    mustNotAssume: z.array(z.string()),
  }),
  drift: z.object({
    change: z.string(),
    expectImpacted: z.array(z.string()),
    mustPreserve: z.array(z.string()),
  }).optional(),
});

export type Scenario = z.infer<typeof ScenarioSchema>;
