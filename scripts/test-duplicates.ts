import { db } from '../src/platform/storage/db';
import { persistPipelineArtifacts } from '../src/workflow/artifacts/persistArtifacts';

async function assertCondition(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("--- [PHASE] Idempotency & Duplicate Testing ---");

  // Setup: Create a fake workflow
  const mockUserId = 'cmqxcol2x000036hapv0xfsrp';
  const org = await db.organization.create({ data: { name: 'Dup Org', slug: 'dup-org-'+Date.now(), ownerId: mockUserId } });
  const project = await db.project.create({ data: { name: 'Dup Project', organizationId: org.id } });
  const wf = await db.workflow.create({
    data: { name: 'Dup Test WF', creatorId: mockUserId, projectId: project.id, status: 'DRAFT' }
  });

  const mockTasks = [
    {
      title: 'Task A',
      description: 'Desc A',
      type: 'frontend',
      estimatedHours: 5,
      requirements: ['REQ-1'],
      acceptanceCriteria: ['Pass A'],
      dependencies: []
    }
  ];

  const ctx: any = {
    input: { workflowId: wf.id, userId: mockUserId },
    artifacts: {
      tasks: { tasks: mockTasks }
    }
  };

  // Run generation phase 1
  await persistPipelineArtifacts(ctx);

  const count1 = await db.task.count({ where: { workflowId: wf.id } });
  await assertCondition(count1 === 1, 'First generation creates 1 task');

  // Run generation phase 2
  await persistPipelineArtifacts(ctx);

  const count2 = await db.task.count({ where: { workflowId: wf.id } });
  await assertCondition(count2 === 1, 'Second generation should be idempotent (1 task remaining)');

  console.log("🎉 DUPLICATE INVARIANTS PASSED.");
}

main().catch(e => { console.error(e); process.exit(1); });
