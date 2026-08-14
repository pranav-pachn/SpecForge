import { test, expect } from '@playwright/test';
import { clearE2EDatabase } from './helpers/db';

test.describe('SpecForge AI Smoke Test (Opt-In Real Provider)', () => {
  let testWorkflowId: string;

  test.skip(process.env.RUN_AI_SMOKE !== 'true', 'Skipping AI smoke test because RUN_AI_SMOKE is not set to true');

  test.beforeAll(async () => {
    await clearE2EDatabase();
  });

  test('Validates workflow generation with a real AI provider', async ({ page }) => {
    // Increase timeout significantly because real LLMs can take 30-60 seconds for complex generation
    test.setTimeout(300000); // 5 minutes
    
    // Login
    await page.goto('/login?demo=true');
    await page.waitForURL('**/dashboard');
    
    // Create workflow
    const prompt = 'Build a simple task management app with tasks, lists, and due dates. Users can sign in and manage their own tasks.';
    await page.getByTestId('workflow-idea-input').fill(prompt);
    await page.getByTestId('create-workflow-button').click();
    
    await page.waitForURL('**/workflow/**');
    const url = page.url();
    const match = url.match(/workflow\/([a-zA-Z0-9_-]+)/);
    expect(match).not.toBeNull();
    if (match) testWorkflowId = match[1];

    // Wait for the Clarify tab which proves the first real LLM call (InteractiveClarificationPipeline) succeeded
    await page.waitForSelector('[data-testid="workflow-stage-clarify"]', { timeout: 60000 });
    
    // We expect the AI to have generated questions!
    await page.waitForSelector('[data-testid="clarification-question"]', { timeout: 30000 });
    
    const questions = await page.getByTestId('clarification-question').all();
    expect(questions.length).toBeGreaterThan(0);
    
    // Log the generated questions for inspection
    console.log(`Real AI provider generated ${questions.length} clarification questions.`);
    
    // We could continue through the pipeline, but validating the first phase is enough to prove the gateway is functioning and keys are valid.
    // If we wanted to go further, we'd have to answer the AI's dynamic questions, which requires dynamic answers.
    // We'll answer them with a generic response just to push to SPEC.
    
    for (const q of questions) {
      const submitBtn = q.getByTestId('clarification-submit');
      const radio = q.locator('input[type="radio"]').first();
      
      if (await radio.isVisible()) {
        await radio.check();
      } else {
        const textarea = q.locator('textarea');
        if (await textarea.isVisible()) {
          await textarea.fill('Use standard industry best practices.');
        }
      }
      
      await submitBtn.click();
      await expect(submitBtn).toBeHidden({ timeout: 10000 });
    }

    const completeButton = page.getByTestId('complete-clarification-button');
    await expect(completeButton).toBeEnabled();
    await completeButton.click();

    // Verify it moves to Spec and generates a real spec
    await page.waitForSelector('[data-testid="nav-stage-spec"]', { state: 'visible', timeout: 30000 });
    await page.getByTestId('nav-stage-spec').click();
    
    // Check that the spec contains markdown content (not empty)
    const specContentArea = page.locator('.markdown-body, .prose');
    await expect(specContentArea).toBeVisible({ timeout: 15000 });
    
    const text = await specContentArea.innerText();
    expect(text.length).toBeGreaterThan(100);
    
    console.log("AI Smoke test successfully completed up to SPEC generation.");
  });
});
