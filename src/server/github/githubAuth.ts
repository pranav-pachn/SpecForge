import { createSign } from "crypto";

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

/** GitHub App JWT (RS256). Max lifetime is 10 minutes. */
export function createGithubAppJwt(appId: string, privateKeyPem: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const privateKey = privateKeyPem.includes("\\n") ? privateKeyPem.replace(/\\n/g, "\n") : privateKeyPem;
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iat: nowSeconds - 60,
    exp: nowSeconds + 9 * 60,
    iss: appId,
  }));
  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  return `${signingInput}.${signer.sign(privateKey).toString("base64url")}`;
}

export async function mintInstallationToken(installationId: string): Promise<string | null> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
  if (!appId || !privateKey) return null;

  const jwt = createGithubAppJwt(appId, privateKey);
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "SpecForge",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { token?: string };
  return body.token ?? null;
}

/** Installation token when the app is configured, otherwise the server PAT. */
export async function resolveGithubToken(installationId: string | null): Promise<string | null> {
  if (installationId) {
    const minted = await mintInstallationToken(installationId);
    if (minted) return minted;
  }
  return process.env.GITHUB_TOKEN || null;
}
