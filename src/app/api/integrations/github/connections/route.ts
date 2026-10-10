import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, getAuthenticatedUser, jsonResponse } from "@/infrastructure/services/api-helpers";
import { db } from "@/platform/storage/db";

export const dynamic = "force-dynamic";

const githubName = z.string().regex(/^[A-Za-z0-9_.-]+$/).max(100);

const CreateConnectionSchema = z.object({
  owner: githubName,
  repo: githubName,
  installationId: z.string().regex(/^\d+$/).max(20).optional(),
});

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const connections = await db.repositoryConnection.findMany({
    where: { userId: user.id, provider: "github" },
    orderBy: { createdAt: "desc" },
    select: { id: true, owner: true, repo: true, installationId: true, createdAt: true },
  });

  return jsonResponse(connections.map((connection) => ({
    ...connection,
    createdAt: connection.createdAt.toISOString(),
  })));
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = CreateConnectionSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid repository", 400);

  const where = {
    provider_owner_repo: { provider: "github", owner: parsed.data.owner, repo: parsed.data.repo },
  };
  const existing = await db.repositoryConnection.findUnique({ where, select: { id: true, userId: true } });
  if (existing && existing.userId !== user.id) {
    return apiError("Repository is already connected to another account", 409);
  }

  const connection = existing
    ? await db.repositoryConnection.update({
        where: { id: existing.id },
        data: { installationId: parsed.data.installationId },
        select: { id: true, owner: true, repo: true, installationId: true },
      })
    : await db.repositoryConnection.create({
        data: {
          userId: user.id,
          provider: "github",
          owner: parsed.data.owner,
          repo: parsed.data.repo,
          installationId: parsed.data.installationId ?? null,
        },
        select: { id: true, owner: true, repo: true, installationId: true },
      });

  return jsonResponse(connection, existing ? 200 : 201);
}
