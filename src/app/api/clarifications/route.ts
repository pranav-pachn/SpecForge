import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const versionId = searchParams.get("versionId");
  const workflowId = searchParams.get("workflowId");

  if (!versionId && !workflowId) {
    return apiError("versionId or workflowId is required", 400);
  }

  try {
    const whereClause: any = {};
    if (versionId) {
      whereClause.versionId = versionId;
      whereClause.version = {
        artifact: {
          workflow: {
            creatorId: user.id
          }
        }
      };
    } else if (workflowId) {
      whereClause.version = {
        artifact: {
          workflowId: workflowId,
          workflow: {
            creatorId: user.id
          }
        }
      };
    }

    const questions = await db.clarificationQuestion.findMany({
      where: whereClause,
      include: { answer: true },
      orderBy: { createdAt: "asc" },
    });
    return jsonResponse(questions);
  } catch (error) {
    return apiError("Failed to fetch clarification questions", 500);
  }
}
