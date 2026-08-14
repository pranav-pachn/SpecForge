import { test, expect } from '@playwright/test';
import { clearE2EDatabase } from './helpers/db';

test.describe('SpecForge Core Workflow E2E (UI)', () => {
  let testWorkflowId: string;

  test.beforeAll(async () => {
    // Isolated Test Infrastructure
    await clearE2EDatabase();
  });

  test('Validates complete workflow via UI interactions', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full workflow
    
    // --- 1. SETUP / LOGIN ---
    // Use the demo login bypass
    await page.goto('/login?demo=true');
    // Wait to be redirected to dashboard
    await page.waitForURL('**/dashboard');
    
    // --- 2. WORKFLOW CREATION ---
    await page.getByTestId('workflow-idea-input').fill('A complete workflow test for Playwright testing.');
    await page.getByTestId('create-workflow-button').click();
    
    // Wait for redirect to the workflow page
    await page.waitForURL('**/workflow/**');
    const url = page.url();
    const match = url.match(/workflow\/([a-zA-Z0-9_-]+)/);
    expect(match).not.toBeNull();
    if (match) testWorkflowId = match[1];

    // --- 3. CLARIFICATION PHASE ---
    // Wait for the Clarify tab to become active
    await page.waitForSelector('[data-testid="workflow-stage-clarify"]', { timeout: 15000 });
    
    // We expect at least one required question to block progression
    const completeButton = page.getByTestId('complete-clarification-button');
    await expect(completeButton).toBeDisabled();

    // Answer the questions
    // Wait for questions to render
    await page.waitForSelector('[data-testid="clarification-question"]', { timeout: 15000 });
    
    const questions = await page.getByTestId('clarification-question').all();
    for (const q of questions) {
      // Find the submit button within this question
      const submitBtn = q.getByTestId('clarification-submit');
      
      // Select the first radio option (if exists) or type something
      const radio = q.locator('input[type="radio"]').first();
      if (await radio.isVisible()) {
        await radio.check();
      } else {
        const textarea = q.locator('textarea');
        if (await textarea.isVisible()) {
          await textarea.fill('Playwright test answer');
        }
      }
      
      await submitBtn.click();
      // Wait for it to become resolved (button disappears)
      await expect(submitBtn).toBeHidden();
    }

    // Now the Complete Phase button should be enabled
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    // --- 4. SPECIFICATION PHASE ---
    // Wait for SpecTab to render
    await page.getByTestId('nav-stage-spec').click();
    
    // Wait for the approve button on the spec tab. Playwright can find it by text if we didn't add testId
    const approveSpecBtn = page.getByRole('button', { name: /Approve Spec/i });
    await expect(approveSpecBtn).toBeVisible({ timeout: 15000 });
    await approveSpecBtn.click();

    // --- 5. PLAN PHASE (Architecture & Tasks) ---
    // The pipeline navigation should allow us to go to Plan
    await page.getByTestId('nav-stage-plan').click();
    
    // Wait for the Generate Plan button
    const generatePlanBtn = page.getByRole('button', { name: /Generate Implementation Plan/i });
    await expect(generatePlanBtn).toBeVisible({ timeout: 15000 });
    await generatePlanBtn.click();

    // Wait for the plan to be generated and the Approve Plan button to appear
    const approvePlanBtn = page.getByRole('button', { name: /Approve Plan/i });
    await expect(approvePlanBtn).toBeVisible({ timeout: 30000 });
    await approvePlanBtn.click();
    
    // --- 6. EXECUTE PHASE ---
    await page.getByTestId('nav-stage-execute').click();
    const generatePacksBtn = page.getByRole('button', { name: /Generate Execution Packs/i });
    if (await generatePacksBtn.isVisible()) {
      await generatePacksBtn.click();
    }

    // --- 7. ENGINEERING REVIEW & VALIDATION ---
    await page.getByTestId('nav-stage-eng-review').click();
    const approveReviewBtn = page.getByRole('button', { name: /Approve Review/i });
    await expect(approveReviewBtn).toBeVisible({ timeout: 20000 });
    await approveReviewBtn.click();

    await page.getByTestId('nav-stage-validate').click();
    const validateBtn = page.getByRole('button', { name: /Run Final Validation/i });
    await expect(validateBtn).toBeVisible({ timeout: 15000 });
    await validateBtn.click();

    // Wait for Validation to complete
    await expect(page.getByText(/Validation Passed/i)).toBeVisible({ timeout: 15000 });
  });
});
