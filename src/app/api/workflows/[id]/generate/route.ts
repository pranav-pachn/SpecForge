import { NextRequest } from "next/server";
import { db } from "@/platform/storage/db";
import { getAuthenticatedUser, apiError } from "@/infrastructure/services/api-helpers";
import { WorkflowContext } from "@/workflow/engine/WorkflowContext";
import { EventBus } from "@/workflow/engine/EventBus";
import { WorkflowEngine } from "@/workflow/engine/WorkflowEngine";
import { StandardPipeline, InteractiveClarificationPipeline, InteractiveGenerationPipeline } from "@/workflow/engine/Pipeline";
import { persistPipelineArtifacts } from "@/workflow/artifacts/persistArtifacts";
import { RuntimeRegistry } from "@/runtime/RuntimeRegistry";
import { registerStandardAgents } from "@/workflow/engine/Pipeline";
import { isBlockingQuestion } from "@/workflow/clarifications/mergeQuestions";

export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user) return apiError("Unauthorized", 401);

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return apiError("Invalid JSON", 400);
  }

  const { rawIdea, ...intakeFields } = body;
  const workflowId = params.id;

  // Verify ownership
  const workflow = await db.workflow.findUnique({
    where: { id: workflowId, creatorId: user.id },
  });
  if (!workflow) return apiError("Workflow not found", 404);

  if (body.phase === "generate") {
    const openQuestions = await db.clarificationQuestion.findMany({
      where: { status: "OPEN", version: { artifact: { workflowId } } },
    });
    const blocking = openQuestions.filter(isBlockingQuestion);
    if (blocking.length > 0) {
      return apiError(
        `Unresolved blocking clarifications: ${blocking.map((q) => q.id).join(", ")}. Generation is paused.`,
        409
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(payload));
      };

      const eventBus = new EventBus();
      eventBus.on('PipelineStarted', (e) => send('progress', { stage: 'Pipeline', status: 'started' }));
      eventBus.on('AgentStarted', (e) => send('progress', { stage: e.agent, status: 'running' }));
      eventBus.on('AgentCompleted', (e) => send('progress', { stage: e.agent, status: 'done' }));
      eventBus.on('AgentFailed', (e) => send('progress', { stage: e.agent, status: 'failed', error: e.payload?.message }));

      const ctx: WorkflowContext = {
        input: {
          workflowId,
          userId: user.id,
          rawIdea,
          ...intakeFields,
        },
        artifacts: {},
        execution: {
          startedAt: new Date(),
          stages: [],
        }
      };

      try {
        registerStandardAgents(RuntimeRegistry.getInstance());
      } catch (e) {
        // Already registered
      }

      const engine = new WorkflowEngine(eventBus);

      try {
        let pipelineToRun = StandardPipeline;
        if (body.phase === 'clarify') {
          pipelineToRun = InteractiveClarificationPipeline;
        } else if (body.phase === 'generate') {
          pipelineToRun = InteractiveGenerationPipeline;
          
          if (body.clarifications) {
            ctx.artifacts.clarify = {
              assumptions: [],
              questions: Array.isArray(body.clarifications) ? body.clarifications : [],
              confidenceScore: 100,
            };
          }
          if (body.planning) {
             ctx.artifacts.planning = body.planning;
          }
        }

        await engine.execute(pipelineToRun, ctx);
        await persistPipelineArtifacts(ctx);
        send('complete', { workflowId });
      } catch (err: any) {
        console.error("Pipeline Error:", err);
        send('error', { message: err.message || "Unknown error" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
