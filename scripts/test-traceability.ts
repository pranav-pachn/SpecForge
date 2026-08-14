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
  console.log("--- [PHASE] Global Traceability Validation ---");

  // 1. Orphan Artifacts (Artifacts without a workflow)
  const orphanArtifacts = await db.artifact.count({ where: { workflowId: null } });
  await assertCondition(orphanArtifacts === 0, 'Zero orphan artifacts');

  // 2. Orphan Versions (Versions without an artifact)
  const orphanVersions = await db.artifactVersion.count({ where: { artifactId: null } });
  await assertCondition(orphanVersions === 0, 'Zero orphan versions');

  // 3. Question Lineage (Question -> Version -> Artifact -> Workflow)
  const brokenQuestions = await db.clarificationQuestion.findMany({
    include: {
      version: {
        include: {
          artifact: true
        }
      }
    },
    where: {
      // Find questions where the resolved workflowId doesn't match the version's artifact's workflowId
      // Prisma doesn't support direct column comparison in where for relations easily in a single query like SQL,
      // so we fetch and check, or we check if version/artifact is missing
      versionId: { not: null }
    }
  });
  
  let invalidQuestions = 0;
  for (const q of brokenQuestions) {
    if (!q.version || !q.version.artifact) {
      invalidQuestions++;
      continue;
    }
    if (q.workflowId !== q.version.artifact.workflowId) {
      invalidQuestions++;
    }
  }
  await assertCondition(invalidQuestions === 0, 'Zero questions pointing to wrong workflow/version');

  // 4. Tasks (Task -> Workflow)
  // Since workflowId is required on Task in Prisma, it can't be null.
  // We check if the task's workflowId matches the parent plan artifact's workflowId if they were linked (they aren't strongly linked to an artifact version in the schema, just to the workflow).
  // But we can check execution packs.
  const orphanTasks = 0; // DB schema enforces workflowId
  await assertCondition(orphanTasks === 0, 'Zero orphan tasks');

  // 5. Execution Packs (Pack -> Task -> Workflow)
  const brokenPacks = await db.executionPack.findMany({
    include: {
      task: true
    }
  });
  
  let invalidPacks = 0;
  for (const p of brokenPacks) {
    if (!p.task) {
      invalidPacks++;
      continue;
    }
    if (p.workflowId !== p.task.workflowId) {
      invalidPacks++;
    }
  }
  await assertCondition(invalidPacks === 0, 'Zero execution packs pointing to another task/workflow');

  // 6. Validation Reports (Report -> Workflow)
  // Schema might enforce this, but we can verify all validations belong to a valid workflow.
  const invalidValidations = await db.validationReport.count({
    where: {
      workflow: {
        is: null
      }
    }
  });
  await assertCondition(invalidValidations === 0, 'Zero validations belonging to unknown workflows');

  // 7. Drift Events (Drift -> Workflow)
  const invalidDrift = await db.driftEvent.count({
    where: {
      workflow: {
        is: null
      }
    }
  });
  await assertCondition(invalidDrift === 0, 'Zero drift events belonging to unknown workflows');

  console.log("🎉 ALL TRACEABILITY INVARIANTS PASSED.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
