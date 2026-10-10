import { apiError, getAuthenticatedUser, jsonResponse } from "@/infrastructure/services/api-helpers";
import { db } from "@/platform/storage/db";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const deleted = await db.repositoryConnection.deleteMany({
    where: { id: params.id, userId: user.id, provider: "github" },
  });
  if (deleted.count === 0) return apiError("Repository connection not found", 404);
  return jsonResponse({ deleted: true });
}
