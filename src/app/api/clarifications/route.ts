import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const versionId = searchParams.get("versionId");

  if (!versionId) {
    return apiError("versionId is required", 400);
  }

  try {
    const questions = await db.clarificationQuestion.findMany({
      where: { versionId },
      include: { answer: true },
      orderBy: { createdAt: "asc" },
    });
    return jsonResponse(questions);
  } catch (error) {
    return apiError("Failed to fetch clarification questions", 500);
  }
}
