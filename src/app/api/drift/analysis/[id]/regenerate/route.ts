import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { selections } = await req.json();

    const analysis = await db.driftAnalysis.findUnique({
      where: { id: params.id },
      include: { workflow: true }
    });

    if (!analysis) return apiError("Drift analysis not found", 404);
    if (analysis.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    // This is a stub for the MVP selective regeneration.
    // In a fully integrated flow, this would call the AI pipeline functions
    // for regenerating specific plan sections, specific tasks, and specific execution packs.
    
    // For now, we update the status of the drift analysis to "REGENERATING" then "RESOLVED"
    await db.driftAnalysis.update({
      where: { id: params.id },
      data: { status: "REGENERATING" }
    });

    // Simulate AI regeneration delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Resolve all related drift events
    await db.driftEvent.updateMany({
      where: {
        versionId: analysis.oldVersionId,
        resolved: false
      },
      data: { resolved: true }
    });

    // Mark analysis as resolved
    const updated = await db.driftAnalysis.update({
      where: { id: params.id },
      data: { status: "RESOLVED" }
    });

    return jsonResponse(updated);
  } catch (error) {
    console.error("Selective Regeneration Error:", error);
    return apiError("Failed to regenerate artifacts", 500);
  }
}
