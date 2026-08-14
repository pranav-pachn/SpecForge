import { NextRequest } from "next/server";
import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, apiError, jsonResponse } from "@/infrastructure/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  const taskId = params.id;
  
  try {
    const { dependsOnId } = await req.json();

    if (!dependsOnId) {
      return apiError("dependsOnId is required", 400);
    }

    if (taskId === dependsOnId) {
      return apiError("Task cannot depend on itself", 400);
    }

    // Get the task to verify ownership/workflow
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { workflow: true }
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workflow.creatorId !== user.id) return apiError("Unauthorized", 401);

    // Fetch all task dependencies for this workflow to check for cycles
    const allDependencies = await db.taskDependency.findMany({
      where: {
        task: { workflowId: task.workflowId }
      }
    });

    // Build adjacency list
    const graph: Record<string, string[]> = {};
    for (const dep of allDependencies) {
      if (!graph[dep.taskId]) graph[dep.taskId] = [];
      graph[dep.taskId].push(dep.dependsOnId);
    }

    // Temporarily add the new edge
    if (!graph[taskId]) graph[taskId] = [];
    graph[taskId].push(dependsOnId);

    // DFS to find cycle
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const isCyclic = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && isCyclic(neighbor)) {
            return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }
      }
      recStack.delete(node);
      return false;
    };

    // Check from the node we just added to
    if (isCyclic(taskId)) {
      return apiError("Circular dependency detected", 400);
    }

    // If no cycle, create dependency
    const newDep = await db.taskDependency.create({
      data: {
        taskId,
        dependsOnId
      }
    });

    return jsonResponse(newDep, 201);
  } catch (error: any) {
    console.error("Failed to add dependency:", error);
    if (error.code === 'P2002') {
      return apiError("Dependency already exists", 409);
    }
    return apiError("Failed to add dependency", 500);
  }
}
