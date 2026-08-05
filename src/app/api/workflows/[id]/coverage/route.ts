import { NextRequest, NextResponse } from "next/server";
import { CoverageEngine } from '@/intelligence/validation/CoverageEngine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowId = params.id;
    const report = await CoverageEngine.calculateCoverage(workflowId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("[Coverage API] Error fetching coverage:", error);
    return NextResponse.json(
      { error: "Failed to fetch coverage data" },
      { status: 500 }
    );
  }
}
