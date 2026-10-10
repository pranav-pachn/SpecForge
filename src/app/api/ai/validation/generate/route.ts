import { NextRequest } from "next/server";
import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, apiError, jsonResponse } from "@/infrastructure/services/api-helpers";
import { ValidationEngine, ValidationContext, FullTask } from "@/infrastructure/services/validation-engine";
import { extractRequirementIds } from "@/testing/evaluation/requirements";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const { workflowId } = await req.json();

  const workflow = await db.workflow.findUnique({
    where: { id: workflowId, creatorId: user.id },
    include: {
      artifacts: { include: { versions: { orderBy: { version: "desc" }, take: 1 } } },
      tasks: { include: { dependencies: true, executionPacks: true } }
    }
  });

  if (!workflow) return apiError("Workflow not found", 404);

  const specArtifact = workflow.artifacts.find(a => a.type === "SPEC");
  const planArtifact = workflow.artifacts.find(a => a.type === "PLAN");

  if (!specArtifact || !planArtifact || !specArtifact.versions[0]) {
    return apiError("Required artifacts not found", 400);
  }

  const specContent = specArtifact.versions[0].content;
  const requirements = extractRequirementIds(specContent);

  const ctx: ValidationContext = {
    workflowId,
    versionId: specArtifact.versions[0].id,
    specContent,
    planContent: planArtifact.versions[0].content,
    tasks: workflow.tasks as FullTask[],
    requirements
  };

  const engine = new ValidationEngine();
  const result = await engine.analyze(ctx);

  const getCat = (id: string) => result.categories.find(c => c.id === id);

  await db.validationReport.deleteMany({ where: { versionId: specArtifact.versions[0].id } });

  const report = await db.validationReport.create({
    data: {
      workflowId,
      versionId: specArtifact.versions[0].id,
      overallScore: result.overallScore,
      coverageScore: getCat('coverage')?.score || 0,
      taskMappingScore: getCat('taskMapping')?.score || 0,
      acceptanceScore: getCat('acceptance')?.score || 0,
      executionScore: getCat('execution')?.score || 0,
      dependencyScore: getCat('dependency')?.score || 0,
      duplicateScore: getCat('duplicate')?.score || 0,
      status: result.status ?? "INCOMPLETE",
      coverageData: JSON.stringify(getCat('coverage')),
      taskMappingData: JSON.stringify(getCat('taskMapping')),
      acceptanceData: JSON.stringify(getCat('acceptance')),
      executionData: JSON.stringify(getCat('execution')),
      dependencyData: JSON.stringify(getCat('dependency')),
      duplicateData: JSON.stringify(getCat('duplicate')),
      issues: {
        create: result.issues.map(i => ({
          severity: i.severity,
          category: i.category,
          title: i.title,
          description: i.description,
          linkedRequirementId: i.linkedRequirementId,
          linkedTaskId: i.linkedTaskId,
          recommendation: i.recommendation
        }))
      }
    }
  });

  return jsonResponse(report);
}
