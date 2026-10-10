import type { ReviewOutcome } from "@/server/policy/reviewJudge";

/** GitHub check-run conclusion. Incomplete reviews are never reported as success. */
export type CheckConclusion = "success" | "neutral" | "failure" | "action_required";

export function outcomeToCheckConclusion(outcome: ReviewOutcome): CheckConclusion {
  switch (outcome) {
    case "PASS":
      return "success";
    case "COMMENT":
      return "neutral";
    case "REQUEST_CHANGES":
      return "failure";
    case "INCOMPLETE":
      return "action_required";
  }
}

export function checkRunPayload(input: {
  headSha: string;
  outcome: ReviewOutcome;
  summary: string;
  reasons: string[];
}) {
  const text = [input.summary, ...input.reasons.map((reason) => `- ${reason}`)]
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .slice(0, 60_000);

  return {
    name: "SpecForge",
    head_sha: input.headSha,
    status: "completed" as const,
    conclusion: outcomeToCheckConclusion(input.outcome),
    output: {
      title: `SpecForge ${input.outcome}`,
      summary: text || `SpecForge ${input.outcome}`,
    },
  };
}
