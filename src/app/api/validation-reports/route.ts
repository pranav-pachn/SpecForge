import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return apiError("workflowId is required", 400);
  }

  try {
    const report = await db.validationReport.findFirst({
      where: { workflowId },
      include: {
        issues: {
          include: {
            task: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });

    return jsonResponse(report);
  } catch (error) {
    console.error(error);
    return apiError("Failed to fetch validation report", 500);
  }
}
