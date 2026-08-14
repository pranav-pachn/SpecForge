import { db } from '../src/platform/storage/db';
import { handleArtifactDrift } from '../src/infrastructure/services/drift-engine';
import { gateway } from '../src/ai/gateway/gateway';

async function assertCondition(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ ${message}`);
  } else {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log("--- [PHASE] Drift Engine Testing ---");

  // Setup: Create a fake workflow
  const mockUserId = 'cmqxcol2x000036hapv0xfsrp';
  const org = await db.organization.create({ data: { name: 'Drift Org', slug: 'drift-org-'+Date.now(), ownerId: mockUserId } });
  const project = await db.project.create({ data: { name: 'Drift Project', organizationId: org.id } });
  const wf = await db.workflow.create({
    data: { name: 'Drift Test WF', creatorId: mockUserId, projectId: project.id, status: 'VALIDATING' }
  });

  // Create Specification V1
  const specContentV1 = `
# Requirements
- REQ-1: Support Google OAuth
  `;
  const spec = await db.artifact.create({ data: { workflowId: wf.id, type: 'SPEC', title: 'Specification' } });
  const v1 = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 1, content: specContentV1, status: 'APPROVED' } });

  // Create Downstream Artifacts (Plan, Task)
  const plan = await db.artifact.create({ data: { workflowId: wf.id, type: 'PLAN', title: 'Implementation Plan' } });
  const planV1 = await db.artifactVersion.create({ data: { artifactId: plan.id, version: 1, content: 'Plan V1', status: 'APPROVED' } });

  const task = await db.task.create({
    data: {
      workflowId: wf.id,
      title: 'Implement Google OAuth',
      description: 'Setup Google OAuth provider in NextAuth',
      status: 'TODO',
      order: 0,
      requirements: ['REQ-1']
    }
  });

  // Create Specification V2 with an added requirement
  const specContentV2 = `
# Requirements
- REQ-1: Support Google OAuth
- REQ-2: Support GitHub OAuth
  `;
  const v2 = await db.artifactVersion.create({ data: { artifactId: spec.id, version: 2, content: specContentV2, status: 'APPROVED' } });

  // Mock the gateway's AI response for drift detection
  const originalExecute = gateway.execute.bind(gateway);
  gateway.execute = async (req) => {
    if (req.capability === 'drift') {
      return { 
        text: JSON.stringify({ 
          diffs: [{ type: 'added', requirementId: 'REQ-2', oldText: '', newText: '- REQ-2: Support GitHub OAuth', description: 'Added GitHub Auth' }] 
        }), 
        cached: false 
      };
    }
    return originalExecute(req);
  };

  // Run the Drift Engine
  await handleArtifactDrift(wf.id, 'SPEC', v1.id, v2.id);

  // Assert Drift Events created
  const driftEvents = await db.driftEvent.findMany({ where: { sourceVersionId: v2.id } });
  await assertCondition(driftEvents.length > 0, 'Drift Engine created DriftEvents');

  // Assert downstream artifacts are STALE
  const updatedPlan = await db.artifactVersion.findUnique({ where: { id: planV1.id } });
  await assertCondition(updatedPlan?.status === 'STALE', 'Downstream plan marked STALE');

  const updatedTask = await db.task.findUnique({ where: { id: task.id } });
  // Currently drift engine marks artifacts stale. Task staleness might be tracked via drift events or its own status.
  // Wait, does drift engine mark Tasks STALE? Let's check task drift events.
  const taskDrift = await db.driftEvent.findFirst({ where: { targetType: 'TASK', targetId: task.id } });
  await assertCondition(taskDrift !== null, 'Drift event linked to the downstream task');

  console.log("🎉 DRIFT INVARIANTS PASSED.");

  // Restore gateway
  gateway.execute = originalExecute;
}

main().catch(e => { console.error(e); process.exit(1); });
