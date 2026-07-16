import { db } from "@/lib/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/server/services/api-helpers";
import { NextRequest } from "next/server";
import { ValidationEngine, ValidationContext } from "@/server/services/validation-engine";

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
        tasks: { 
          orderBy: { order: "asc" },
          include: { dependencies: true, executionPacks: true }
        }
      }
    });

    if (!workflow) return apiError("Workflow not found", 404);

    const specContent = workflow.artifacts.find(a => a.type === "SPEC")?.versions?.[0]?.content || "";
    const planContent = workflow.artifacts.find(a => a.type === "PLAN")?.versions?.[0]?.content || "";
    const specVersionId = workflow.artifacts.find(a => a.type === "SPEC")?.versions?.[0]?.id;

    if (!specVersionId) return apiError("Spec version not found for validation binding", 400);

    // Collect all requirements defined in tasks
    const allRequirements = new Set<string>();
    workflow.tasks.forEach(t => {
      (t.requirements || []).forEach(r => allRequirements.add(r));
    });
    // Normally, requirements would be extracted directly from the spec. 
    // Here we use the set of requirements already mapped in tasks as a baseline, 
    // and rely on the AI missing features check to find completely unmapped spec features.

    const context: ValidationContext = {
      workflowId,
      versionId: specVersionId,
      specContent,
      planContent,
      tasks: workflow.tasks as any,
      requirements: Array.from(allRequirements)
    };

    const engine = new ValidationEngine();
    const result = await engine.analyze(context);

    // Save report
    const report = await db.$transaction(async (tx) => {
      // Clear old validation reports for this spec version
      await tx.validationReport.deleteMany({ 
        where: { versionId: specVersionId } 
      });

      const catMap = Object.fromEntries(result.categories.map(c => [c.id, c]));

      const newReport = await tx.validationReport.create({
        data: {
          workflowId,
          versionId: specVersionId,
          overallScore: result.overallScore,
          coverageScore: catMap['coverage']?.score || 0,
          taskMappingScore: catMap['taskMapping']?.score || 0,
          acceptanceScore: catMap['acceptance']?.score || 0,
          executionScore: catMap['execution']?.score || 0,
          dependencyScore: catMap['dependency']?.score || 0,
          duplicateScore: catMap['duplicate']?.score || 0,
          status: result.overallScore >= 80 ? "READY" : "NEEDS_ATTENTION",
          
          coverageData: JSON.stringify(catMap['coverage']),
          taskMappingData: JSON.stringify(catMap['taskMapping']),
          acceptanceData: JSON.stringify(catMap['acceptance']),
          executionData: JSON.stringify(catMap['execution']),
          dependencyData: JSON.stringify(catMap['dependency']),
          duplicateData: JSON.stringify(catMap['duplicate']),
        }
      });

      if (result.issues.length > 0) {
        await tx.validationIssue.createMany({
          data: result.issues.map(iss => ({
            reportId: newReport.id,
            severity: iss.severity,
            category: iss.category,
            title: iss.title,
            description: iss.description,
            linkedRequirementId: iss.linkedRequirementId,
            linkedTaskId: iss.linkedTaskId,
            recommendation: iss.recommendation
          }))
        });
      }

      return newReport;
    });

    return jsonResponse({ success: true, reportId: report.id }, 201);
  } catch (error) {
    console.error("Validation Error:", error);
    return apiError("Failed to run validation", 500);
  }
}
