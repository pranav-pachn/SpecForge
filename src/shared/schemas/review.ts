import { z } from "zod";
import { ReviewFindingSchema } from "./reviewFinding";

/**
 * Request/response contracts for the manual-review vertical (blueprint §7).
 * Input limits are enforced here so oversized or malformed submissions are
 * rejected before any provider call (blueprint §12).
 */

export const REVIEW_LIMITS = {
  maxInputBytes: 200_000, // ~200 KB of pasted code or diff
  maxContextBytes: 20_000,
} as const;

export const ReviewInputKind = z.enum(["CODE", "DIFF"]);
export type ReviewInputKind = z.infer<typeof ReviewInputKind>;

export const ReviewSource = z.enum(["MANUAL", "GITHUB_PR"]);
export type ReviewSource = z.infer<typeof ReviewSource>;

export const ReviewRunStatus = z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "INCOMPLETE"]);
export type ReviewRunStatus = z.infer<typeof ReviewRunStatus>;

export const ReviewOutcomeEnum = z.enum(["PASS", "COMMENT", "REQUEST_CHANGES", "INCOMPLETE"]);
export type ReviewOutcomeEnum = z.infer<typeof ReviewOutcomeEnum>;

const byteLength = (s: string) => new TextEncoder().encode(s).length;

export const CreateReviewRequestSchema = z.object({
  kind: ReviewInputKind,
  /** Raw pasted code or a unified diff, depending on `kind`. */
  content: z
    .string()
    .min(1, "content is required")
    .refine((s) => byteLength(s) <= REVIEW_LIMITS.maxInputBytes, {
      message: `content exceeds ${REVIEW_LIMITS.maxInputBytes} bytes`,
    }),
  /** Optional language hint when detection is uncertain. */
  language: z.string().min(1).max(40).optional(),
  /** Optional extra context (conventions, intent). */
  context: z
    .string()
    .refine((s) => byteLength(s) <= REVIEW_LIMITS.maxContextBytes, {
      message: `context exceeds ${REVIEW_LIMITS.maxContextBytes} bytes`,
    })
    .optional(),
});
export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

export const ReviewCheckResultSchema = z.object({
  analyzer: z.string(),
  status: z.enum(["PASSED", "FAILED", "SKIPPED", "ERROR"]),
  summary: z.string().nullable(),
  required: z.boolean(),
});
export type ReviewCheckResult = z.infer<typeof ReviewCheckResultSchema>;

export const FeedbackVerdict = z.enum(["ACCEPTED", "DISMISSED"]);
export type FeedbackVerdict = z.infer<typeof FeedbackVerdict>;

export const StoredReviewFindingSchema = ReviewFindingSchema.and(
  z.object({
    id: z.string(),
    feedback: FeedbackVerdict.nullable(),
  }),
);

export const ReviewRunSchema = z.object({
  id: z.string(),
  source: ReviewSource,
  status: ReviewRunStatus,
  outcome: ReviewOutcomeEnum.nullable(),
  summary: z.string().nullable(),
  decisionReasons: z.array(z.string()),
  findings: z.array(StoredReviewFindingSchema),
  checks: z.array(ReviewCheckResultSchema),
  provider: z.string().nullable(),
  model: z.string().nullable(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});
export type ReviewRun = z.infer<typeof ReviewRunSchema>;

export const CreateReviewResponseSchema = z.object({
  id: z.string(),
  status: ReviewRunStatus,
});
export type CreateReviewResponse = z.infer<typeof CreateReviewResponseSchema>;
