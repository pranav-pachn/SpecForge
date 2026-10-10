const HANDLED_ACTIONS = new Set(["opened", "synchronize", "reopened"]);
const NAME = /^[A-Za-z0-9_.-]+$/;
const SHA = /^[a-f0-9]{7,40}$/i;

export interface PullRequestWebhook {
  action: "opened" | "synchronize" | "reopened";
  owner: string;
  repo: string;
  number: number;
  title: string;
  url: string;
  baseSha: string;
  headSha: string;
  installationId: string | null;
}

export type ParsedGithubWebhook =
  | { kind: "pull_request"; event: PullRequestWebhook }
  | { kind: "ignored"; reason: string }
  | { kind: "invalid"; reason: string };

/** One review per head SHA. Redeliveries of the same push collapse to this key. */
export function githubReviewIdempotencyKey(
  event: Pick<PullRequestWebhook, "owner" | "repo" | "number" | "headSha">,
): string {
  return `github:${event.owner}/${event.repo}#${event.number}@${event.headSha}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseGithubWebhook(eventName: string | null, payload: unknown): ParsedGithubWebhook {
  if (eventName !== "pull_request") {
    return { kind: "ignored", reason: `Unhandled event: ${eventName ?? "missing"}` };
  }
  const body = asRecord(payload);
  const action = asString(body?.action);
  if (!action || !HANDLED_ACTIONS.has(action)) {
    return { kind: "ignored", reason: `Unhandled pull_request action: ${action ?? "missing"}` };
  }

  const pull = asRecord(body?.pull_request);
  const repository = asRecord(body?.repository);
  const owner = asRecord(repository?.owner);
  const base = asRecord(pull?.base);
  const head = asRecord(pull?.head);
  const installation = asRecord(body?.installation);

  const ownerLogin = asString(owner?.login);
  const repo = asString(repository?.name);
  const title = asString(pull?.title);
  const url = asString(pull?.html_url);
  const baseSha = asString(base?.sha);
  const headSha = asString(head?.sha);
  const number = pull?.number;

  if (
    !ownerLogin || !NAME.test(ownerLogin) ||
    !repo || !NAME.test(repo) ||
    typeof number !== "number" || !Number.isInteger(number) || number < 1 ||
    !title || !url ||
    !baseSha || !SHA.test(baseSha) ||
    !headSha || !SHA.test(headSha)
  ) {
    return { kind: "invalid", reason: "Pull request payload is missing owner, repo, number, or SHAs" };
  }

  const installationId = typeof installation?.id === "number" ? String(installation.id) : null;

  return {
    kind: "pull_request",
    event: {
      action: action as PullRequestWebhook["action"],
      owner: ownerLogin,
      repo,
      number,
      title,
      url,
      baseSha,
      headSha,
      installationId,
    },
  };
}
