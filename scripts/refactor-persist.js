const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/workflow/artifacts/persistArtifacts.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
content = content.replace(
  "import { MemoryEngine } from '@/intelligence/memory/MemoryEngine';",
  `import { PlatformEventBus } from '@/platform/events/PlatformEventBus';
import { EventFactory } from '@/platform/events/factory/EventFactory';
import { EventPublisher } from '@/platform/events/dispatcher/EventPublisher';`
);

// 2. Remove MemoryCaptureJob interface
content = content.replace(/interface MemoryCaptureJob \{[\s\S]*?\}/, '');

// 3. Update function signature
content = content.replace(
  "export async function persistPipelineArtifacts(ctx: WorkflowContext): Promise<void> {",
  "export async function persistPipelineArtifacts(ctx: WorkflowContext, publisher: EventPublisher = PlatformEventBus.getPublisher()): Promise<void> {"
);

// 4. Replace memoryJobs array with events array
content = content.replace(
  "const memoryJobs: MemoryCaptureJob[] = [];",
  "const eventsToPublish: any[] = [];"
);

// 5. Replace memoryJobs.push with eventsToPublish.push for SPEC
content = content.replace(
  /memoryJobs\.push\(\{[\s\S]*?artifactType: "SPEC",[\s\S]*?\}\);/,
  `eventsToPublish.push(EventFactory.specificationCreated({
        artifactId: specArtifact.id,
        versionId: specVersionId,
        content: specContent
      }, ctx.input.workflowId, ctx.input.userId));`
);

// 6. Replace memoryJobs.push for ARCHITECTURE
content = content.replace(
  /memoryJobs\.push\(\{[\s\S]*?artifactType: "ARCHITECTURE",[\s\S]*?\}\);/,
  `eventsToPublish.push(EventFactory.architectureGenerated({
        artifactId: archArtifact.id,
        versionId: archVersionId,
        content: archContent
      }, ctx.input.workflowId, ctx.input.userId));`
);

// 7. Replace memoryJobs.push for TASK_BREAKDOWN
content = content.replace(
  /memoryJobs\.push\(\{[\s\S]*?artifactType: "TASK_BREAKDOWN",[\s\S]*?\}\);/,
  `eventsToPublish.push(EventFactory.tasksGenerated({
        artifactId: breakdownArtifact.id,
        versionId: breakdownVersionId,
        content: taskContent
      }, ctx.input.workflowId, ctx.input.userId));`
);

// 8. Replace memoryJobs execution at the end
content = content.replace(
  /\/\/ Execute Memory Jobs asynchronously[\s\S]*?\}\n/m,
  `// Publish Domain Events asynchronously
  for (const event of eventsToPublish) {
    publisher.publish(event).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }
  
  // Publish ReviewCompleted if review artifact exists
  if (ctx.artifacts.review && specVersionId) { // Just using specVersionId as proxy
    publisher.publish(EventFactory.reviewCompleted({
      reviewId: "review-" + Date.now(), // Placeholder for MVP
      overallScore: ctx.artifacts.review.overallScore
    }, ctx.input.workflowId, ctx.input.userId)).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }
`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored persistArtifacts.ts');
