import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: ['error']
});

async function main() {
  console.log('Connecting to database...');

  const workflows = await db.workflow.findMany({
    include: {
      artifacts: {
        include: {
          versions: { orderBy: { version: 'desc' }, take: 1 }
        }
      },
      tasks: { take: 3 }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log('\n=== WORKFLOWS (' + workflows.length + ') ===');
  for (const w of workflows) {
    console.log(`  ID: ${w.id}`);
    console.log(`  Name: ${w.name}`);
    console.log(`  Status: ${w.status}`);
    console.log(`  Artifacts: ${w.artifacts.map(a => a.type).join(', ') || 'none'}`);
    console.log(`  Tasks: ${w.tasks.length}`);
    console.log('');
  }

  const questions = await db.clarificationQuestion.findMany({
    include: { answer: true, version: { include: { artifact: true } } },
    take: 10
  });
  console.log(`=== CLARIFICATION QUESTIONS (${questions.length}) ===`);
  for (const q of questions) {
    console.log(`  Q: ${q.question.substring(0, 60)}...`);
    console.log(`  Status: ${q.status} | HasAnswer: ${!!q.answer} | WorkflowId: ${q.version?.artifact?.workflowId}`);
  }

  const tasks = await db.task.findMany({
    include: { executionPacks: true },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\n=== TASKS (${tasks.length}) ===`);
  for (const t of tasks) {
    console.log(`  Task: ${t.title.substring(0, 60)}`);
    console.log(`  WorkflowId: ${t.workflowId} | Status: ${t.status} | Packs: ${t.executionPacks.length}`);
  }

  const reviews = await db.engineeringReview.findMany({ include: { findings: true }, take: 3 });
  console.log(`\n=== ENGINEERING REVIEWS (${reviews.length}) ===`);
  for (const r of reviews) {
    console.log(`  Review: ${r.id} | WorkflowId: ${r.workflowId} | Score: ${r.overallScore} | Status: ${r.status} | Findings: ${r.findings.length}`);
  }

  const driftEvents = await db.driftEvent.findMany({ take: 5 });
  const driftAnalyses = await db.driftAnalysis.findMany({ take: 5 });
  console.log(`\n=== DRIFT EVENTS: ${driftEvents.length} | DRIFT ANALYSES: ${driftAnalyses.length} ===`);

  const validationReports = await db.validationReport.findMany({ take: 3, include: { issues: true } });
  console.log(`\n=== VALIDATION REPORTS (${validationReports.length}) ===`);
  for (const r of validationReports) {
    console.log(`  Report: ${r.id} | WorkflowId: ${r.workflowId} | Score: ${r.overallScore} | Issues: ${r.issues.length}`);
  }

  const execPacks = await db.executionPack.findMany({ take: 5 });
  console.log(`\n=== EXECUTION PACKS (${execPacks.length}) ===`);
  for (const p of execPacks) {
    console.log(`  Pack: ${p.id} | TaskId: ${p.taskId} | Tool: ${p.toolName} | ContentLen: ${p.content?.length || 0}`);
  }

  // Orphan check
  const allWorkflowIds = new Set(workflows.map(w => w.id));
  const orphanTasks = tasks.filter(t => !allWorkflowIds.has(t.workflowId));
  console.log(`\n=== ORPHAN TASKS: ${orphanTasks.length} ===`);
}

main()
  .catch(e => console.error('ERROR:', e.message))
  .finally(() => db.$disconnect());
