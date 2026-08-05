const fs = require('fs');
let code = fs.readFileSync('src/workflow/artifacts/persistArtifacts.ts', 'utf8');

// 1. Replace memoryJobs with eventsToPublish
code = code.replace(/const memoryJobs: MemoryCaptureJob\[\] = \[\];/, `const eventsToPublish: any[] = [];
  let specVersionId: string | null = null;`);
code = code.replace(/interface MemoryCaptureJob \{[\s\S]*?\}/, '');
code = code.replace(/    let specVersionId: string \| null = null;/, '');

// 2. SPEC
code = code.replace(
  /memoryJobs\.push\(\{\s*workflowId: ctx\.input\.workflowId,\s*artifactType: "SPEC",\s*sourceVersionId: specVersionId,\s*oldContent: oldSpecContent,\s*newContent: specContent,\s*\}\);/,
  `eventsToPublish.push(EventFactory.specificationCreated({
        artifactId: specArtifact.id,
        versionId: specVersionId as string,
        content: specContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));`
);

// 3. PLAN
code = code.replace(
  /memoryJobs\.push\(\{\s*workflowId: ctx\.input\.workflowId,\s*artifactType: "PLAN",\s*sourceVersionId: planVersionId,\s*oldContent: oldPlanContent,\s*newContent: planContent,\s*\}\);/,
  ""
);

// 4. ARCHITECTURE
code = code.replace(
  /memoryJobs\.push\(\{\s*workflowId: ctx\.input\.workflowId,\s*artifactType: "ARCHITECTURE",\s*sourceVersionId: archVersionId,\s*oldContent: oldArchContent,\s*newContent: archContent,\s*\}\);/,
  `eventsToPublish.push(EventFactory.architectureGenerated({
        artifactId: archArtifact.id,
        versionId: archVersionId as string,
        content: archContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));`
);

// 5. TASKS
code = code.replace(
  /memoryJobs\.push\(\{\s*workflowId: ctx\.input\.workflowId,\s*artifactType: "TASKS",\s*sourceVersionId: taskVersionId,\s*oldContent: oldTaskContent,\s*newContent: taskContent,\s*\}\);/,
  `eventsToPublish.push(EventFactory.tasksGenerated({
        artifactId: breakdownArtifact.id,
        versionId: taskVersionId as string,
        content: taskContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));`
);

// 6. End loop
code = code.replace(
  /for \(const job of memoryJobs\) \{\s*MemoryEngine\.captureDecision\(\s*job\.workflowId,\s*job\.artifactType,\s*job\.sourceVersionId,\s*job\.oldContent,\s*job\.newContent\s*\)\.catch\(e => console\.error\("\[MemoryEngine\] Async capture failed:", e\)\);\s*\}/,
  `for (const event of eventsToPublish) {
    publisher.publish(event).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }
  
  // Publish ReviewCompleted if review artifact exists
  if (ctx.artifacts.review && specVersionId) { 
    publisher.publish(EventFactory.reviewCompleted({
      reviewId: "review-" + Date.now(), 
      overallScore: ctx.artifacts.review.overallScore
    }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId })).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }`
);

// 7. Imports
code = code.replace(
  "import { MemoryEngine } from '@/intelligence/memory/MemoryEngine';",
  `import { PlatformEventBus } from '@/platform/events/PlatformEventBus';\nimport { EventFactory } from '@/platform/events/factory/EventFactory';\nimport { EventPublisher } from '@/platform/events/dispatcher/EventPublisher';`
);

code = code.replace(
  "export async function persistPipelineArtifacts(ctx: WorkflowContext): Promise<void> {",
  "export async function persistPipelineArtifacts(ctx: WorkflowContext, publisher: EventPublisher = PlatformEventBus.getPublisher()): Promise<void> {"
);

fs.writeFileSync('src/workflow/artifacts/persistArtifacts.ts', code);
console.log("Fixed persistArtifacts.ts cleanly");
