import { db } from '../src/platform/storage/db';
import { POST as RunValidation } from '../src/app/api/ai/validation/route';
import { NextRequest } from 'next/server';

async function assertCondition(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("--- [PHASE] Broken Chain Validation Testing ---");

  // Setup: Create a fake workflow
  const mockUserId = 'cmqxcol2x000036hapv0xfsrp';
  const org = await db.organization.create({ data: { name: 'Broken Chain Org', slug: 'bc-org-'+Date.now(), ownerId: mockUserId } });
  const project = await db.project.create({ data: { name: 'BC Project', organizationId: org.id } });
  const wf = await db.workflow.create({
    data: { name: 'Broken Chain Test WF', creatorId: mockUserId, projectId: project.id, status: 'VALIDATING' }
  });

  // Create Specification with REQ-1 and REQ-2
  const specContent = `
# Requirements
- REQ-1: Support Google OAuth
- REQ-2: Support GitHub OAuth
  `;
  const spec = await db.artifact.create({ data: { workflowId: wf.id, type: 'SPEC', title: 'Specification' } });
  await db.artifactVersion.create({ data: { artifactId: spec.id, version: 1, content: specContent } });

  // Create Tasks that only cover REQ-1
  await db.task.create({
    data: {
      workflowId: wf.id,
      title: 'Implement Google OAuth',
      description: 'Setup Google OAuth provider in NextAuth',
      status: 'TODO',
      order: 0,
      requirements: ['REQ-1']
    }
  });
  
  // Create an Execution Pack for the task just so it's there
  const tasks = await db.task.findMany({ where: { workflowId: wf.id } });
  await db.executionPack.create({
    data: {
      taskId: tasks[0].id,
      workflowId: wf.id,
      status: 'PENDING',
      version: 1,
      content: 'Code for Google OAuth'
    }
  });

  // Create Engineering Review
  const review = await db.artifact.create({ data: { workflowId: wf.id, type: 'REVIEW', title: 'Review' } });
  await db.artifactVersion.create({ data: { artifactId: review.id, version: 1, content: 'LGTM', status: 'APPROVED' } });

  // Mock user for API
  process.env.E2E_TEST_USER = JSON.stringify({ id: mockUserId, email: 'e2e@specforge.dev' });

  // Run the Validation Engine via the API route
  const req = new NextRequest('http://localhost/api/ai/validation', {
    method: 'POST',
    body: JSON.stringify({ workflowId: wf.id })
  });
  await RunValidation(req);
  delete process.env.E2E_TEST_USER;

  // Check the Validation Report
  const report = await db.validationReport.findFirst({
    where: { workflowId: wf.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!report) {
    console.error('❌ ASSERTION FAILED: Validation report was not generated');
    process.exit(1);
  }

  // Expect: REQ-1 -> COVERED, REQ-2 -> UNCOVERED, Validation -> FAILED
  const details = report.details as any;
  const passed = report.passed;

  await assertCondition(passed === false, 'Validation explicitly FAILS due to uncovered requirements');
  
  let req1Covered = false;
  let req2Uncovered = false;
  
  if (Array.isArray(details.requirements)) {
    for (const req of details.requirements) {
      if (req.id === 'REQ-1' && req.status === 'COVERED') req1Covered = true;
      if (req.id === 'REQ-2' && req.status === 'UNCOVERED') req2Uncovered = true;
    }
  }

  await assertCondition(req1Covered, 'REQ-1 is reported as COVERED');
  await assertCondition(req2Uncovered, 'REQ-2 is reported as UNCOVERED');

  console.log("🎉 BROKEN CHAIN TEST PASSED.");
}

main().catch(e => { console.error(e); process.exit(1); });
