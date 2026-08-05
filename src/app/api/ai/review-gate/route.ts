import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, jsonResponse, apiError } from "@/infrastructure/services/api-helpers";
import { NextRequest } from "next/server";
import { SpecificationReviewAgent } from "@/agents/SpecificationReviewAgent";
import { ReviewCheckType, CheckStatus } from "@prisma/client";
import { WorkflowContext } from "@/workflow/engine/WorkflowContext";
import { AgentRuntime } from "@/runtime/AgentRuntime";
import { EventBus } from "@/workflow/engine/EventBus";
import { ExecutionGraph } from "@/runtime/engine/ExecutionGraph";
import { ExecutionContext } from "@/runtime/context/ExecutionContext";
import { CancellationRegistry } from "@/runtime/cancellation/CancellationRegistry";
import { AgentRequest } from "@/runtime/interfaces/AgentRequest";
import { RuntimeRegistry } from "@/runtime/RuntimeRegistry";
import { registerStandardAgents } from "@/workflow/engine/Pipeline";

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { versionId, specContent } = await req.json();

    if (!versionId || !specContent) {
      return apiError("versionId and specContent are required", 400);
    }

    // Ensure agents are registered (idempotent if registry uses a check or if already registered)
    const registry = RuntimeRegistry.getInstance();
    try { registry.getAgent('spec_review'); } catch { registerStandardAgents(registry); }

    const workflowId = `mock-review-${Date.now()}`;
    const eventBus = new EventBus();
    const runtime = new AgentRuntime(eventBus);
    const cancellationToken = CancellationRegistry.getInstance().register(workflowId);

    const execContext: ExecutionContext = {
      workflowId,
      projectId: "",
      userId: user.id,
      traceId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      artifacts: {
        specification: { markdown: specContent, requirements: [] }
      },
      cancellationToken
    };

    const request: AgentRequest = {
      workflowId,
      userId: user.id,
      payload: { rawIdea: "" }
    };

    const graph = new ExecutionGraph([{ id: 'group-1', agentIds: ['spec_review'], priority: 0 }]);
    const state = await runtime.runGraph(graph, request, execContext);

    CancellationRegistry.getInstance().unregister(workflowId);

    if (state.status === 'FAILED' || state.status === 'TIMEOUT') {
      return apiError("Review gate failed", 500);
    }

    const result = execContext.artifacts['spec_review'];
    if (!result || !result.checks) {
      return apiError("Review gate did not produce valid checks", 500);
    }

    // Save checks to DB
    await db.$transaction(async (tx) => {
      // Clear old checks for this version
      await tx.reviewCheck.deleteMany({ where: { versionId } });

      // Insert new checks
      for (const check of result.checks) {
        await tx.reviewCheck.create({
          data: {
            versionId,
            type: check.type as ReviewCheckType,
            status: check.status as CheckStatus,
            description: check.description,
          },
        });
      }
    });

    return jsonResponse(result.checks, 201);
  } catch (error) {
    console.error("Review Gate error:", error);
    return apiError("Failed to run review gate", 500);
  }
}
