import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { EngineeringReviewEngine, EngineeringReviewContext } from "@/server/services/engineering-review-engine";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { workflowId } = await req.json();
    if (!workflowId) return apiError("workflowId is required", 400);

    const workflow = await db.workflow.findUnique({
      where: { id: workflowId, creatorId: user.id },
      include: { 
        artifacts: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } },
        tasks: { orderBy: { order: "asc" } }
      }
    });

    if (!workflow) return apiError("Workflow not found", 404);

    const specContent = workflow.artifacts.find((a: any) => a.type === "SPEC")?.versions?.[0]?.content || "";
    const planContent = workflow.artifacts.find((a: any) => a.type === "PLAN")?.versions?.[0]?.content || "";
    const planVersionId = workflow.artifacts.find((a: any) => a.type === "PLAN")?.versions?.[0]?.id;
    
    if (!planVersionId) return apiError("Plan version not found for review binding", 400);

    const context: EngineeringReviewContext = {
      workflowId,
      versionId: planVersionId,
      specContent,
      planContent,
      tasks: workflow.tasks
    };

    const engine = new EngineeringReviewEngine();
    const result = await engine.analyze(context);
    const catMap = Object.fromEntries(result.categories.map(c => [c.id, c]));

    let status = "READY";
    if (result.overallScore < 80) status = "NEEDS_ATTENTION";
    
    const review = await db.$transaction(async (tx) => {
      // Clear old engineering review for this plan version
      await tx.engineeringReview.deleteMany({
        where: { versionId: planVersionId }
      });

      const newReview = await tx.engineeringReview.create({
        data: {
          workflowId,
          versionId: planVersionId,
          overallScore: result.overallScore,
          coverageScore: catMap['coverage']?.score || 0,
          testingScore: catMap['testing']?.score || 0,
          securityScore: catMap['security']?.score || 0,
          performanceScore: catMap['performance']?.score || 0,
          architectureScore: catMap['architecture']?.score || 0,
          deploymentScore: catMap['deployment']?.score || 0,
          rollbackScore: catMap['rollback']?.score || 0,
          status,
          coverageData: JSON.stringify(catMap['coverage']),
          testingData: JSON.stringify(catMap['testing']),
          securityData: JSON.stringify(catMap['security']),
          performanceData: JSON.stringify(catMap['performance']),
          architectureData: JSON.stringify(catMap['architecture']),
          deploymentData: JSON.stringify(catMap['deployment']),
          rollbackData: JSON.stringify(catMap['rollback']),
        }
      });

      if (result.issues.length > 0) {
        await tx.reviewFinding.createMany({
          data: result.issues.map(iss => ({
            reviewId: newReview.id,
            category: iss.category,
            severity: iss.severity,
            title: iss.title,
            description: iss.description
          }))
        });
      }

      return newReview;
    });

    return jsonResponse({ success: true, reviewId: review.id }, 201);
  } catch (error) {
    console.error("Engineering Review Error:", error);
    return apiError("Failed to run engineering review", 500);
  }
}
