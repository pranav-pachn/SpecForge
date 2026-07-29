import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser, apiError } from "@/server/services/api-helpers";
import { WorkflowContext } from "@/lib/ai/engine/WorkflowContext";
import { EventBus } from "@/lib/ai/engine/EventBus";
import { WorkflowEngine } from "@/lib/ai/engine/WorkflowEngine";
import { StandardPipeline } from "@/lib/ai/engine/Pipeline";
import { persistPipelineArtifacts } from "@/lib/ai/engine/persistArtifacts";

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

      const engine = new WorkflowEngine(eventBus);

      try {
        await engine.execute(StandardPipeline, ctx);
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
