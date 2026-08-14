import { test, expect } from '@playwright/test';
import { e2eDb, clearE2EDatabase } from './helpers/db';
import { assertWorkflowStateConsistency, assertArtifactIntegrity } from './helpers/assertions';

test.describe('SpecForge Core Workflow E2E', () => {
  let testWorkflowId: string;

  test.beforeAll(async () => {
    // Isolated Test Infrastructure
    // DB URL should be set to e2e in env
    await clearE2EDatabase();
  });

  test('Validates 4-layer state machine and artifacts', async ({ page, request }) => {
    // --- 1. SETUP ---
    // Navigate to root to start
    await page.goto('/');

    const orgRes = await e2eDb.organization.create({
      data: { name: 'E2E Org', slug: 'e2e-org', ownerId: 'cmqxcol2x000036hapv0xfsrp' } // Assuming this ID is valid or we create one
    });
    // Wait, e2eDb is imported. We can just create a project.
    const project = await e2eDb.project.create({
      data: { name: 'E2E Project', organization: { create: { name: 'Org', slug: 'org-'+Date.now(), ownerId: (await e2eDb.user.findFirst())?.id || 'cmqxcol2x000036hapv0xfsrp' } } }
    });

    const createRes = await request.post('/api/workflows', {
      data: {
        name: 'E2E Test Workflow',
        rawIdea: 'Testing the 4 layers',
        projectId: project.id
      }
    });
    expect(createRes.ok()).toBeTruthy();
    const workflow = await createRes.json();
    testWorkflowId = workflow.id;

    await page.goto(`/workflow/${testWorkflowId}`);

    // LAYER 1 & 2 & 3: State Machine, Artifact Integrity, and Refresh Durability

    // --- DRAFT ---
    await assertWorkflowStateConsistency(page, testWorkflowId, 'DRAFT');

    // LAYER 4: Negative Transitions
    // Attempt invalid transition DRAFT -> COMPLETED
    const invalidRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'COMPLETED' }
    });
    // Should fail (400 or 409 depending on implementation, but NOT 200)
    expect(invalidRes.ok()).toBeFalsy();
    
    // Check DB remains DRAFT
    await assertWorkflowStateConsistency(page, testWorkflowId, 'DRAFT');

    // Transition to CLARIFYING
    let transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'CLARIFYING' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload(); // Refresh Durability
    await assertWorkflowStateConsistency(page, testWorkflowId, 'CLARIFYING');
    await assertArtifactIntegrity(testWorkflowId, 'CLARIFYING');

    // Transition to SPEC_REVIEW
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'SPEC_REVIEW' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'SPEC_REVIEW');
    await assertArtifactIntegrity(testWorkflowId, 'SPEC_REVIEW');

    // Transition to PLANNING
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'PLANNING' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'PLANNING');
    await assertArtifactIntegrity(testWorkflowId, 'PLANNING');

    // Transition to TASK_BREAKDOWN
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'TASK_BREAKDOWN' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'TASK_BREAKDOWN');
    await assertArtifactIntegrity(testWorkflowId, 'TASK_BREAKDOWN');

    // LAYER 4: Negative Transition - readiness gate for EXECUTING
    // Attempt EXECUTING without execution packs should fail readiness checks
    const badExecRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'EXECUTING' }
    });
    expect(badExecRes.ok()).toBeFalsy(); // Because Execution Packs aren't ready

    // Transition to READY_FOR_EXECUTION
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'READY_FOR_EXECUTION' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'READY_FOR_EXECUTION');
    await assertArtifactIntegrity(testWorkflowId, 'READY_FOR_EXECUTION');

    // Transition to EXECUTING
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'EXECUTING' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'EXECUTING');
    await assertArtifactIntegrity(testWorkflowId, 'EXECUTING');

    // Transition to ENGINEERING_REVIEW
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'ENGINEERING_REVIEW' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'ENGINEERING_REVIEW');
    await assertArtifactIntegrity(testWorkflowId, 'ENGINEERING_REVIEW');

    // Transition to REVIEWING
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'REVIEWING' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'REVIEWING');
    await assertArtifactIntegrity(testWorkflowId, 'REVIEWING');

    // Transition to VALIDATING
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'VALIDATING' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'VALIDATING');
    await assertArtifactIntegrity(testWorkflowId, 'VALIDATING');

    // Transition to COMPLETED
    transRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'COMPLETED' }
    });
    expect(transRes.ok()).toBeTruthy();
    await page.reload();
    await assertWorkflowStateConsistency(page, testWorkflowId, 'COMPLETED');
    await assertArtifactIntegrity(testWorkflowId, 'COMPLETED');

    // Check invalid transitions from COMPLETED
    const invalidCompRes = await request.patch(`/api/workflows/${testWorkflowId}`, {
      data: { status: 'EXECUTING' }
    });
    expect(invalidCompRes.ok()).toBeFalsy();
  });
});
