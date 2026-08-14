import { expect, Page } from '@playwright/test';
import { e2eDb } from './db';

// Validates the 3-layer data consistency for a workflow state
export async function assertWorkflowStateConsistency(page: Page, workflowId: string, expectedStatus: string) {
  // 1. API Value
  const res = await page.request.get(`/api/workflows/${workflowId}`);
  expect(res.ok()).toBeTruthy();
  const apiWorkflow = await res.json();
  expect(apiWorkflow.status).toBe(expectedStatus);

  // 2. Database Value
  const dbWorkflow = await e2eDb.workflow.findUnique({
    where: { id: workflowId }
  });
  expect(dbWorkflow).not.toBeNull();
  expect(dbWorkflow?.status).toBe(expectedStatus);

  // 3. UI Value (Check if the correct tab/status text is active)
  // Assuming the UI displays the status in uppercase somewhere, or the active tab corresponds to it.
  await expect(page.locator(`text=${expectedStatus}`)).toBeVisible();
}

// Validates Artifacts exist and are properly tied to the workflow
export async function assertArtifactIntegrity(workflowId: string, stage: string) {
  // E.g., for TASK_BREAKDOWN, we assert Tasks exist in DB with workflowId.
  if (stage === 'TASK_BREAKDOWN') {
    const tasks = await e2eDb.task.findMany({ where: { workflowId } });
    expect(tasks.length).toBeGreaterThan(0);
  }
  // Add other artifact checks based on the schema...
}
