import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { VisualDiffEngine } from "@/platform/sandbox/VisualDiffEngine";
import path from "path";

// In a real implementation, workspace path would be stored or derived dynamically
// For MVP, we will assume a generic workspace path or use the project root if no specific sandbox exists
const DEFAULT_WORKSPACE_PATH = process.cwd(); // Assume the project itself is the workspace for now

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = params;

  try {
    const workflow = await db.workflow.findUnique({
      where: { id },
      select: { id: true, creatorId: true }
    });

    if (!workflow) {
      return apiError("Workflow not found", 404);
    }
    
    // We instantiate the engine to generate the diffs dynamically.
    // Over time, this could accept `?executionId=...` to query historical diffs.
    const diffEngine = new VisualDiffEngine();
    
    // The workspacePath in a fully multi-tenant architecture would be:
    // `/tmp/workspaces/${workflow.id}` or similar. We use DEFAULT_WORKSPACE_PATH for MVP.
    const diffs = await diffEngine.generateDiff(workflow.id, DEFAULT_WORKSPACE_PATH);
    
    return jsonResponse(diffs);
  } catch (error: any) {
    console.error("Failed to fetch diffs:", error);
    return apiError("Failed to fetch diffs", 500);
  }
}
