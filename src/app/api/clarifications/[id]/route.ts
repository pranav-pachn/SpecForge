import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/lib/api-helpers";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { answer, status } = await req.json();

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
