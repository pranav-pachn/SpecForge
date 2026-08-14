import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { answer, status } = await req.json();

    // Invariant check: verify ownership of the associated workflow
    const existingQuestion = await db.clarificationQuestion.findUnique({
      where: { id: params.id },
      include: {
        version: {
          include: {
            artifact: {
              include: {
                workflow: true
              }
            }
          }
        }
      }
    });

    if (!existingQuestion) {
      return apiError("Clarification question not found", 404);
    }

    if (existingQuestion.version.artifact.workflow.creatorId !== user.id) {
      return apiError("Unauthorized to modify this clarification question", 403);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (answer !== undefined) {
      updateData.answer = {
        upsert: {
          create: { answer },
          update: { answer },
        },
      };
      if (!status) updateData.status = "ANSWERED";
    }

    const question = await db.clarificationQuestion.update({
      where: { id: params.id },
      data: updateData,
      include: { answer: true },
    });

    return jsonResponse(question);
  } catch (error) {
    return apiError("Failed to update clarification question", 500);
  }
}
