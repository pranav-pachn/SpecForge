import { z } from "zod";
import { FindingCategory, FindingConfidence, FindingSeverity } from "@/shared/schemas/reviewFinding";

/** What the model is allowed to return. Source and validation status are assigned by us. */
export const ModelFindingSchema = z.object({
  category: FindingCategory,
  severity: FindingSeverity,
  confidence: FindingConfidence,
  title: z.string().min(1),
  description: z.string().min(1),
  filePath: z.string().nullable(),
  startLine: z.number().int().nullable(),
  endLine: z.number().int().nullable(),
  evidence: z.string().min(1),
  impact: z.string().min(1),
  suggestedFix: z.string().nullable(),
});

export const ModelReviewSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(ModelFindingSchema),
});

export type ModelReview = z.infer<typeof ModelReviewSchema>;

export const CODE_REVIEW_SYSTEM_PROMPT = `You are a careful software engineer reviewing a code change.
Report only defects that are visible in the submitted code or diff.
Every finding must quote a verbatim snippet from the submission as evidence.
Do not invent files, line numbers, APIs, or behavior you cannot see.
If you are not sure a line number is in the change, set startLine and endLine to null.
If there are no defects, return an empty findings array.
Do not claim the code is secure or bug-free.`;
