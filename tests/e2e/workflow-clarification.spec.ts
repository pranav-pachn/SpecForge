import { test, expect } from '@playwright/test';
import { e2eDb, clearE2EDatabase } from './helpers/db';

test.describe('Workflow Clarification Phase', () => {
  test.beforeAll(async () => {
    // Isolated Test Infrastructure
    await clearE2EDatabase();
  });

  test('creates a workflow, waits for clarification, and approves spec', async ({ page }) => {
    // 1. Setup E2E Organization and User session
    const orgRes = await e2eDb.organization.create({
      data: { name: 'E2E Org', slug: 'e2e-org', ownerId: 'cmqxcol2x000036hapv0xfsrp' } 
    });
    
    const project = await e2eDb.project.create({
      data: { name: 'E2E Project', organizationId: orgRes.id }
    });

    // Mock NextAuth session
    await page.addInitScript(() => {
      window.sessionStorage.setItem('next-auth.session-token', 'e2e-mock-token');
    });

    // 2. Navigate to Dashboard
    await page.goto('/dashboard');
    
    // 3. Create Workflow via FeatureComposer
    const ideaInput = "Build an authentication system with Google OAuth and RBAC for a SaaS app.";
    await page.getByPlaceholder(/Build an authentication system/i).fill(ideaInput);
    
    // Start listening for network request to verify single execution
    const generateRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/generate') && request.method() === 'POST') {
        generateRequests.push(request);
      }
    });

    await page.getByRole('button', { name: /Create Workflow/i }).click();

    // 4. Verify ProgressRail UI
    await expect(page.getByText('Phase 1: Clarification')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Planning')).toBeVisible();
    await expect(page.getByText('Clarifying')).toBeVisible();

    // 5. Wait for Redirect to Clarify Tab
    await page.waitForURL(/\/workflow\/.*[?]tab=clarify|.*\/workflow\/.*/, { timeout: 45000 });
    
    // Wait for the clarify tab to render properly
    await expect(page.getByTestId('workflow-stage-clarify')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Engineering Decisions')).toBeVisible();

    // Verify generation occurred exactly once
    expect(generateRequests.length).toBe(1);

    // 6. Verify Database State
    const currentUrl = page.url();
    const workflowId = currentUrl.match(/\/workflow\/([^/?]+)/)?.[1];
    expect(workflowId).toBeDefined();

    const wfDb = await e2eDb.workflow.findUnique({
      where: { id: workflowId },
      include: { artifacts: true }
    });
    
    expect(wfDb?.status).toBe('CLARIFYING');
    
    const specArtifact = wfDb?.artifacts.find(a => a.type === 'SPEC');
    const planArtifact = wfDb?.artifacts.find(a => a.type === 'PLAN');
    expect(specArtifact).toBeDefined();
    expect(planArtifact).toBeDefined();

    // Verify rawIdea is persisted
    const specVersion = await e2eDb.artifactVersion.findFirst({
      where: { artifactId: specArtifact!.id },
      orderBy: { version: 'desc' }
    });
    expect(specVersion?.content).toBe(ideaInput);

    // 7. Test Approval Gate Rejection
    const completePhaseBtn = page.getByTestId('complete-clarification-button');
    
    // Check if there are required unanswered questions
    const requiredQuestions = await page.getByTestId('clarification-question').filter({ hasText: 'Required Decision' }).all();
    
    if (requiredQuestions.length > 0) {
      await expect(completePhaseBtn).toBeDisabled();

      // Answer all required questions
      for (const questionEl of requiredQuestions) {
        // Find the first radio option and click it
        await questionEl.locator('input[type="radio"]').first().click();
        
        // Click Save Decision
        await questionEl.getByTestId('clarification-submit').click();
        
        // Wait for it to become resolved
        await expect(questionEl.getByText('Resolved', { exact: true })).toBeVisible();
      }
    }

    // Now the button should be enabled
    await expect(completePhaseBtn).toBeEnabled();
    
    // 8. Complete Phase
    await completePhaseBtn.click();
    
    // 9. Verify transition to SPEC_REVIEW
    await page.waitForResponse(res => res.url().includes(`/api/workflows/${workflowId}`) && res.request().method() === 'PATCH');
    
    const updatedWf = await e2eDb.workflow.findUnique({
      where: { id: workflowId! }
    });
    
    expect(updatedWf?.status).toBe('SPEC_REVIEW');
  });
});
