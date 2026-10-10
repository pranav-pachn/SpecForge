require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { WorkflowEngine } = require('./src/workflow/engine/WorkflowEngine');
const { InteractiveClarificationPipeline } = require('./src/workflow/engine/Pipeline');
const { EventBus } = require('./src/workflow/engine/EventBus');

async function main() {
  const workflow = await prisma.workflow.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!workflow) return console.log("No workflow found");
  
  // Notice: NOT calling registerStandardAgents!
  
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
  const engine = new WorkflowEngine(eventBus);
  console.log("Starting engine execute WITHOUT registration...");
  try {
    await engine.execute(InteractiveClarificationPipeline, ctx);
    console.log("Engine finished successfully!");
  } catch (err) {
    console.error("Engine threw an error:", err.message);
  }
  process.exit(0);
}
main().catch(console.error);
