import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { SimulationReportGenerator } from "@/platform/sandbox/SimulationReportGenerator";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const searchParams = req.nextUrl.searchParams;
  const workflowId = searchParams.get("workflowId");

  if (!workflowId) {
    return apiError("workflowId is required", 400);
  }

  try {
    const dbReport = await db.validationReport.findFirst({
      where: { workflowId },
      orderBy: { generatedAt: 'desc' },
      include: { issues: true }
    });

    if (!dbReport) {
      return jsonResponse(null);
    }

    const coverageData = dbReport.coverageData ? JSON.parse(dbReport.coverageData) : null;
    const taskMappingData = dbReport.taskMappingData ? JSON.parse(dbReport.taskMappingData) : null;
    const executionData = dbReport.executionData ? JSON.parse(dbReport.executionData) : null;

    const hasCritical = dbReport.issues.some((issue) => issue.severity === "critical");
    const honestPass = (dbReport.status === "PASSED" || dbReport.status === "READY") && !hasCritical;
    const riskLevel = hasCritical || dbReport.status === "FAILED" || dbReport.status === "INCOMPLETE"
      ? "HIGH"
      : dbReport.overallScore >= 90 ? "LOW" : dbReport.overallScore >= 70 ? "MEDIUM" : "HIGH";
    const recommendation = dbReport.status === "INCOMPLETE"
      ? "INCOMPLETE"
      : honestPass ? "SAFE_TO_APPLY" : "NEEDS_REVIEW";
    
    const engReview = await db.engineeringReview.findFirst({
      where: { workflowId },
      orderBy: { generatedAt: 'desc' }
    });

    const securityScore = engReview?.securityScore ?? null;
    const performanceScore = engReview?.performanceScore ?? null;
    const architectureScore = engReview?.architectureScore ?? null;

    // Normalize for the Product Validation Dashboard
    const normalizedReport = {
      workflowId,
      confidence: {
        overall: dbReport.overallScore,
        specification: dbReport.coverageScore,
        architecture: dbReport.taskMappingScore,
        tasks: dbReport.acceptanceScore,
        execution: dbReport.executionScore
      },
      risk: {
        level: riskLevel,
        score: Math.max(0, 100 - dbReport.overallScore),
        factors: dbReport.issues.map(i => i.title).slice(0, 3)
      },
      impact: {
        files: executionData?.items?.length || 0,
        services: taskMappingData?.items?.length || 0,
        apis: coverageData?.items?.length || 0,
        databaseChanges: 0
      },
      evaluation: {
        correctness: { passed: honestPass, score: dbReport.overallScore, status: dbReport.status },
        security: { 
          passed: securityScore !== null ? securityScore >= 80 : false,
          score: securityScore ?? 0,
          evaluated: securityScore !== null
        },
        performance: { 
          passed: performanceScore !== null ? performanceScore >= 80 : false,
          score: performanceScore ?? 0,
          evaluated: performanceScore !== null
        },
        architecture: {
          passed: architectureScore !== null ? architectureScore >= 80 : false,
          score: architectureScore ?? 0,
          evaluated: architectureScore !== null
        }
      },
      repairs: {
        total: 0,
        successful: 0,
        failed: 0,
        history: []
      },
      evidence: {
        requirements: coverageData?.items?.length ? `${coverageData.items.length}/${coverageData.items.length}` : '0/0',
        tasks: taskMappingData?.items?.length ? `${taskMappingData.items.length}/${taskMappingData.items.length}` : '0/0',
        files: executionData?.items?.length ? `${executionData.items.length}/${executionData.items.length}` : '0/0',
        checks: dbReport.issues.length === 0 ? 'All critical checks passed' : `${dbReport.issues.length} issues found`
      },
      recommendation
    };

    return jsonResponse(normalizedReport);
  } catch (error) {
    console.error(error);
    return apiError("Failed to fetch validation report", 500);
  }
}
