require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { WorkflowEngine } = require('./src/workflow/engine/WorkflowEngine');
const { InteractiveClarificationPipeline, registerStandardAgents } = require('./src/workflow/engine/Pipeline');
const { EventBus } = require('./src/workflow/engine/EventBus');
const { RuntimeRegistry } = require('./src/runtime/RuntimeRegistry');
const { persistPipelineArtifacts } = require('./src/workflow/artifacts/persistArtifacts');

async function main() {
  const workflow = await prisma.workflow.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!workflow) return console.log("No workflow found");
  
  registerStandardAgents(RuntimeRegistry.getInstance());
  
  const ctx = {
    input: {
      workflowId: workflow.id,
      userId: workflow.creatorId,
      rawIdea: "Build an inventory management system with React and Node"
    },
    artifacts: {},
    execution: { startedAt: new Date(), stages: [] }
  };
  
  const eventBus = new EventBus();
  eventBus.on('AgentStarted', e => console.log('AgentStarted', e.agent));
  eventBus.on('AgentCompleted', e => console.log('AgentCompleted', e.agent));
  eventBus.on('AgentFailed', e => console.log('AgentFailed', e.agent, e.payload));
  
  const engine = new WorkflowEngine(eventBus);
  console.log("Starting engine execute...");
  try {
    await engine.execute(InteractiveClarificationPipeline, ctx);
    console.log("Engine finished. Artifacts keys:", Object.keys(ctx.artifacts));
    console.log("Planning artifact exists:", !!ctx.artifacts.planning);
    console.log("Clarify artifact exists:", !!ctx.artifacts.clarify);
    
    // Now try persisting!
    console.log("Persisting artifacts...");
    await persistPipelineArtifacts(ctx);
    console.log("Persisted.");
    
    const wf = await prisma.workflow.findUnique({ where: { id: workflow.id }});
    console.log("Workflow status:", wf.status);
  } catch (err) {
    console.error("Engine threw:", err);
  }
}
main().catch(console.error);
