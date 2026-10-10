import { checkRunPayload } from "./checkRunStatus";
import type { ReviewOutcome } from "@/server/policy/reviewJudge";

const API = "https://api.github.com";

function headers(token: string, accept = "application/vnd.github+json"): HeadersInit {
  return {
    Accept: accept,
    Authorization: `Bearer ${token}`,
    "User-Agent": "SpecForge",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchPullRequestDiff(input: {
  owner: string;
  repo: string;
  number: number;
  token: string;
}): Promise<{ ok: true; diff: string } | { ok: false; status: number }> {
  const response = await fetch(`${API}/repos/${input.owner}/${input.repo}/pulls/${input.number}`, {
    headers: headers(input.token, "application/vnd.github.diff"),
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, diff: await response.text() };
}

export async function publishCheckRun(input: {
  owner: string;
  repo: string;
  token: string;
  headSha: string;
  outcome: ReviewOutcome;
  summary: string;
  reasons: string[];
}): Promise<{ ok: true } | { ok: false; status: number }> {
  const response = await fetch(`${API}/repos/${input.owner}/${input.repo}/check-runs`, {
    method: "POST",
    headers: headers(input.token),
    body: JSON.stringify(checkRunPayload(input)),
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true };
}
