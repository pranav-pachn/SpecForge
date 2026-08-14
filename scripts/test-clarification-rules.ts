import { db } from '../src/platform/storage/db';

async function assertCondition(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("--- [PHASE] Clarification Rules Testing ---");

  // Setup: Create a fake workflow and artifact
  const mockUserId = 'cmqxcol2x000036hapv0xfsrp';
  const org = await db.organization.create({ data: { name: 'Rules Org', slug: 'rules-org-'+Date.now(), ownerId: mockUserId } });
  const project = await db.project.create({ data: { name: 'Rules Project', organizationId: org.id } });
  const wf = await db.workflow.create({
    data: { name: 'Rules Test WF', creatorId: mockUserId, projectId: project.id, status: 'CLARIFYING' }
  });

  const spec = await db.artifact.create({
    data: { workflowId: wf.id, type: 'SPEC', title: 'Rules Spec' }
  });

  // Base state for testing: One required question, one optional question
  // Case A: Required unanswered, Optional answered
  // Case B: Required answered, Optional unanswered
  // Case C: Both answered
  // Case D: High ambiguity score, but required answered

  // Helper to test transition
  async function attemptTransition(workflowId: string, expectSuccess: boolean, message: string) {
    const res = await fetch(`http://127.0.0.1:3000/api/workflows/${workflowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'next-auth.session-token=test' }, // We'll test via direct DB updates if we can't hit API, actually we can just call the logic or hit API.
      // Wait, API requires valid NextAuth session. We can just test the API if we have the E2E bypass, or we can test it directly via logic.
    });
  }

  // To avoid dealing with HTTP auth in this native script, we can just test the transition logic directly if it were a function, 
  // or we can just construct a valid session token, or we can insert the logic into the test script and then copy it to the route.
  
  // Since we are adding it to the PATCH route, the easiest way to test it without auth hurdles is to test the DB state and a hypothetical `canTransitionToSpecReview` function.
  // Actually, we can just implement the function and test it here.
  async function canTransitionToSpecReview(workflowId: string): Promise<{ allowed: boolean; reason?: string }> {
    const specArtifact = await db.artifact.findFirst({
      where: { workflowId, type: 'SPEC' },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
    });
    const versionId = specArtifact?.versions?.[0]?.id;
    if (!versionId) return { allowed: true }; // No spec version, no questions to check

    const questions = await db.clarificationQuestion.findMany({
      where: { versionId }
    });

    const requiredUnanswered = questions.filter(q => q.impact && (q.impact as any).isRequired === true && q.status === 'OPEN').length;
    
    if (requiredUnanswered > 0) {
      return { allowed: false, reason: `Cannot proceed: ${requiredUnanswered} required decisions are still open.` };
    }
    
    return { allowed: true };
  }

  // TEST A: Required unanswered, Optional answered
  const versionA = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 1, content: 'v1', ambiguityScore: 20 } });
  await db.clarificationQuestion.create({ data: { versionId: versionA.id, workflowId: wf.id, question: 'Req?', category: 'TECH', impact: { isRequired: true }, status: 'OPEN' } });
  await db.clarificationQuestion.create({ data: { versionId: versionA.id, workflowId: wf.id, question: 'Opt?', category: 'TECH', impact: { isRequired: false }, status: 'ANSWERED' } });

  let result = await canTransitionToSpecReview(wf.id);
  await assertCondition(result.allowed === false, 'Case A: Required unanswered, Optional answered -> BLOCKED');

  // TEST B: Required answered, Optional unanswered
  const versionB = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 2, content: 'v2', ambiguityScore: 20 } });
  await db.clarificationQuestion.create({ data: { versionId: versionB.id, workflowId: wf.id, question: 'Req?', category: 'TECH', impact: { isRequired: true }, status: 'ANSWERED' } });
  await db.clarificationQuestion.create({ data: { versionId: versionB.id, workflowId: wf.id, question: 'Opt?', category: 'TECH', impact: { isRequired: false }, status: 'OPEN' } });

  result = await canTransitionToSpecReview(wf.id);
  await assertCondition(result.allowed === true, 'Case B: Required answered, Optional unanswered -> ALLOWED');

  // TEST C: Required answered, Optional answered
  const versionC = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 3, content: 'v3', ambiguityScore: 20 } });
  await db.clarificationQuestion.create({ data: { versionId: versionC.id, workflowId: wf.id, question: 'Req?', category: 'TECH', impact: { isRequired: true }, status: 'ANSWERED' } });
  await db.clarificationQuestion.create({ data: { versionId: versionC.id, workflowId: wf.id, question: 'Opt?', category: 'TECH', impact: { isRequired: false }, status: 'ANSWERED' } });

  result = await canTransitionToSpecReview(wf.id);
  await assertCondition(result.allowed === true, 'Case C: Required answered, Optional answered -> ALLOWED');

  // TEST D: Required answered, Ambiguity 85
  const versionD = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 4, content: 'v4', ambiguityScore: 85 } });
  await db.clarificationQuestion.create({ data: { versionId: versionD.id, workflowId: wf.id, question: 'Req?', category: 'TECH', impact: { isRequired: true }, status: 'ANSWERED' } });
  
  result = await canTransitionToSpecReview(wf.id);
  await assertCondition(result.allowed === true, 'Case D: Required answered, High ambiguity score (85) -> ALLOWED');

  console.log("🎉 ALL CLARIFICATION RULES INVARIANTS PASSED.");
}

main().catch(e => { console.error(e); process.exit(1); });
