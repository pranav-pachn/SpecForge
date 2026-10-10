import { createHmac, createVerify, generateKeyPairSync } from "crypto";
import { describe, expect, it } from "vitest";
import { checkRunPayload, outcomeToCheckConclusion } from "@/server/github/checkRunStatus";
import { createGithubAppJwt } from "@/server/github/githubAuth";
import { githubReviewIdempotencyKey, parseGithubWebhook } from "@/server/github/parseWebhook";
import { verifyGithubWebhookSignature } from "@/server/github/webhookSignature";

const event = {
  action: "opened" as const,
  owner: "acme",
  repo: "web",
  number: 12,
  title: "Fix auth check",
  url: "https://github.com/acme/web/pull/12",
  baseSha: "a".repeat(40),
  headSha: "b".repeat(40),
  installationId: "99",
};

function sign(body: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyGithubWebhookSignature", () => {
  it("accepts a matching sha256 signature", () => {
    const body = "{\"ok\":true}";
    expect(verifyGithubWebhookSignature(body, sign(body, "secret"), "secret")).toBe(true);
  });

  it("rejects a wrong secret, a missing header, and an empty secret", () => {
    const body = "{\"ok\":true}";
    expect(verifyGithubWebhookSignature(body, sign(body, "secret"), "other")).toBe(false);
    expect(verifyGithubWebhookSignature(body, null, "secret")).toBe(false);
    expect(verifyGithubWebhookSignature(body, sign(body, "secret"), "")).toBe(false);
  });
});

describe("parseGithubWebhook", () => {
  const payload = {
    action: "synchronize",
    installation: { id: 99 },
    repository: { name: "web", owner: { login: "acme" } },
    pull_request: {
      number: 12,
      title: "Fix auth check",
      html_url: "https://github.com/acme/web/pull/12",
      base: { sha: "a".repeat(40) },
      head: { sha: "b".repeat(40) },
    },
  };

  it("parses opened, synchronize, and reopened pull requests", () => {
    const parsed = parseGithubWebhook("pull_request", payload);
    expect(parsed.kind).toBe("pull_request");
    if (parsed.kind === "pull_request") {
      expect(parsed.event.installationId).toBe("99");
      expect(parsed.event.headSha).toBe("b".repeat(40));
    }
  });

  it("ignores other events and closed pull requests", () => {
    expect(parseGithubWebhook("push", payload).kind).toBe("ignored");
    expect(parseGithubWebhook("pull_request", { ...payload, action: "closed" }).kind).toBe("ignored");
  });

  it("rejects a payload without a valid head SHA", () => {
    const broken = { ...payload, pull_request: { ...payload.pull_request, head: { sha: "not-a-sha" } } };
    expect(parseGithubWebhook("pull_request", broken).kind).toBe("invalid");
  });
});

describe("github review idempotency", () => {
  it("uses owner, repo, number, and head SHA", () => {
    expect(githubReviewIdempotencyKey(event)).toBe(`github:acme/web#12@${"b".repeat(40)}`);
    expect(githubReviewIdempotencyKey({ ...event, headSha: "c".repeat(40) })).not.toBe(githubReviewIdempotencyKey(event));
  });
});

describe("check run conclusions", () => {
  it("never reports an incomplete review as success", () => {
    expect(outcomeToCheckConclusion("PASS")).toBe("success");
    expect(outcomeToCheckConclusion("COMMENT")).toBe("neutral");
    expect(outcomeToCheckConclusion("REQUEST_CHANGES")).toBe("failure");
    expect(outcomeToCheckConclusion("INCOMPLETE")).toBe("action_required");
    const payload = checkRunPayload({
      headSha: "b".repeat(40),
      outcome: "INCOMPLETE",
      summary: "Provider failed",
      reasons: ["Required analysis did not complete: provider (ERROR)"],
    });
    expect(payload.conclusion).toBe("action_required");
    expect(payload.output.summary).toContain("provider");
  });
});

describe("createGithubAppJwt", () => {
  it("signs an RS256 token for the app id", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const pem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();
    const token = createGithubAppJwt("12345", pem, 1_700_000_000);
    const [header, payload, signature] = token.split(".");
    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    expect(verifier.verify(publicKey, Buffer.from(signature, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(payload, "base64url").toString())).toMatchObject({ iss: "12345" });
  });
});
