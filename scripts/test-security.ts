import { NextRequest } from "next/server";
import { db } from '../src/platform/storage/db';

// Import the route handlers directly to test API authorization boundaries
import { PATCH as PatchWorkflow } from '../src/app/api/workflows/[id]/route';
import { GET as GetClarifications, PATCH as PatchClarification } from '../src/app/api/clarifications/route';

async function assertCondition(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("--- [PHASE] Security & Ownership Testing ---");

  // Create User A and User B
  const userAId = 'cmqxcol2x000036hapv0xusera';
  const userBId = 'cmqxcol2x000036hapv0xuserb';

  await db.user.createMany({
    data: [
      { id: userAId, email: 'usera@specforge.dev', name: 'User A' },
      { id: userBId, email: 'userb@specforge.dev', name: 'User B' }
    ],
    skipDuplicates: true
  });

  const orgA = await db.organization.create({ data: { name: 'Org A', slug: 'org-a-'+Date.now(), ownerId: userAId } });
  const projA = await db.project.create({ data: { name: 'Proj A', organizationId: orgA.id } });
  
  // User A creates Workflow A
  const wfA = await db.workflow.create({
    data: { name: 'Workflow A', creatorId: userAId, projectId: projA.id, status: 'CLARIFYING' }
  });

  const specA = await db.artifact.create({
    data: { workflowId: wfA.id, type: 'SPEC', title: 'Spec A' }
  });
  const versionA = await db.artifactVersion.create({ data: { artifactId: specA.id, version: 1, content: 'v1' } });
  
  const questionA = await db.clarificationQuestion.create({ 
    data: { versionId: versionA.id, workflowId: wfA.id, question: 'Q?', category: 'TECH', status: 'OPEN' } 
  });

  // --- Helper to mock the authenticated user context ---
  async function runAsUser(userId: string, email: string, fn: () => Promise<any>) {
    process.env.E2E_TEST_USER = JSON.stringify({ id: userId, email });
    const result = await fn();
    delete process.env.E2E_TEST_USER;
    return result;
  }

  // TEST 1: User B attempts to PATCH workflow A
  const res1 = await runAsUser(userBId, 'userb@specforge.dev', async () => {
    const req = new NextRequest(`http://localhost/api/workflows/${wfA.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SPEC_REVIEW' })
    });
    return PatchWorkflow(req, { params: { id: wfA.id } });
  });
  
  await assertCondition(res1.status === 404 || res1.status === 403, 'User B blocked from patching Workflow A (Expect 403/404)');

  // TEST 2: User B attempts to GET clarifications for workflow A
  const res2 = await runAsUser(userBId, 'userb@specforge.dev', async () => {
    const req = new NextRequest(`http://localhost/api/clarifications?workflowId=${wfA.id}`, { method: 'GET' });
    return GetClarifications(req);
  });
  
  await assertCondition(res2.status === 404 || res2.status === 403, 'User B blocked from fetching Workflow A clarifications (Expect 403/404)');

  // TEST 3: User B attempts to PATCH question A directly (IDOR check)
  const res3 = await runAsUser(userBId, 'userb@specforge.dev', async () => {
    const req = new NextRequest(`http://localhost/api/clarifications`, {
      method: 'PATCH',
      body: JSON.stringify({ questionId: questionA.id, answer: 'Malicious answer' })
    });
    return PatchClarification(req);
  });
  
  await assertCondition(res3.status === 404 || res3.status === 403, 'User B blocked from patching Question A directly (IDOR check)');

  console.log("🎉 ALL SECURITY INVARIANTS PASSED.");
}

main().catch(e => { console.error(e); process.exit(1); });
