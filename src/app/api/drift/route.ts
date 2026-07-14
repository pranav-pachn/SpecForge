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
    const driftEvents = await db.driftEvent.findMany({
      where: {
        version: { artifact: { workflowId, workflow: { creatorId: user.id } } }
      },
      include: {
        version: { include: { artifact: true } },
        sourceVersion: { include: { artifact: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return jsonResponse(driftEvents);
  } catch (error) {
    console.error("Drift Fetch Error:", error);
    return apiError("Failed to fetch drift events", 500);
  }
}
