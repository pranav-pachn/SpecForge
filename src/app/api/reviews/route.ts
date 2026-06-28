import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
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
    const checks = await db.reviewCheck.findMany({
      where: { versionId },
    });
    return jsonResponse(checks);
  } catch (error) {
    return apiError("Failed to fetch review checks", 500);
  }
}
