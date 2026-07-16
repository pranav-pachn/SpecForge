import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) return apiError("workflowId is required", 400);

  try {
    const analysis = await db.driftAnalysis.findFirst({
      where: {
        workflowId,
        workflow: { creatorId: user.id }
      },
      orderBy: { createdAt: "desc" },
      include: {
        oldVersion: true,
        newVersion: true
      }
    });

    return jsonResponse(analysis || null);
  } catch (error) {
    console.error("Drift Analysis Fetch Error:", error);
    return apiError("Failed to fetch drift analysis", 500);
  }
}
