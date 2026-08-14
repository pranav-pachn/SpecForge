const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient({ log: ['error'] });
async function main() {
  // Deep check the OAuth workflow
  const oauthWfs = await db.workflow.findMany({
    where: { name: { contains: 'OAuth' } },
    include: { 
      artifacts: { 
        include: { 
          versions: { 
            orderBy: { version: 'desc' }, take: 1,
            include: { 
              clarifications: { include: { answer: true } },
              engineeringReviews: true,
              reviewChecks: true
            } 
          } 
        } 
      }, 
      tasks: { include: { executionPacks: true } } 
    }
  });
  
  console.log('\n=== OAUTH WORKFLOWS (' + oauthWfs.length + ') ===');
  for (const wf of oauthWfs) {
    console.log('ID:', wf.id, '| Status:', wf.status);
    for (const art of wf.artifacts) {
      const v = art.versions[0];
      console.log('  Artifact:', art.type, '| ContentLen:', v?.content?.length || 0, '| Status:', v?.status);
      console.log('  Clarifications:', v?.clarifications?.length || 0);
    }
    console.log('  Tasks:', wf.tasks.length);
  }

  // Check the full traceability for the theme switcher workflow (cmrnmwc250002102djgfcero8)
  const themWf = await db.workflow.findFirst({
    where: { id: 'cmrnmwc250002102djgfcero8' },
    include: { 
      artifacts: { 
        include: { 
          versions: { 
            orderBy: { version: 'desc' }, take: 1,
            include: { 
              clarifications: { include: { answer: true } }, 
              engineeringReviews: true, 
              reviewChecks: true 
            } 
          } 
        } 
      },
      tasks: { include: { executionPacks: true, dependencies: true } }
    }
  });
  
  if (themWf) {
    console.log('\n=== THEME SWITCHER WORKFLOW (Full traceability) ===');
    console.log('Status:', themWf.status);
    for (const art of themWf.artifacts) {
      const v = art.versions[0];
      console.log('  Artifact:', art.type, '| v.version:', v?.version, '| v.status:', v?.status, '| ContentLen:', v?.content?.length || 0);
      if (v?.clarifications?.length > 0) {
        console.log('    Clarifications:');
        for (const q of v.clarifications) {
          console.log('      - ' + q.question.substring(0,60) + ' | status=' + q.status + ' | answered=' + !!q.answer);
        }
      }
      if (v?.engineeringReviews?.length > 0) {
        console.log('    EngineeringReviews: score=' + v.engineeringReviews.map(r => r.overallScore).join(', '));
      }
      if (v?.reviewChecks?.length > 0) {
        console.log('    ReviewChecks:', v.reviewChecks.map(c => c.type + '=' + c.status).join(', '));
      }
    }
    console.log('  Tasks (' + themWf.tasks.length + '):');
    for (const t of themWf.tasks) {
      console.log('    - ' + t.title.substring(0,60) + ' | packs=' + t.executionPacks.length + ' | reqs=' + JSON.stringify(t.requirements));
    }
  }

  // Check execution packs content
  const packs = await db.executionPack.findMany({ 
    include: { task: { include: { workflow: true } } },
    take: 3
  });
  console.log('\n=== EXECUTION PACKS TRACEABILITY ===');
  for (const p of packs) {
    console.log('Pack:', p.id);
    console.log('  TaskId:', p.taskId, '| Task.workflowId:', p.task?.workflowId);
    console.log('  ContentPreview:', p.content?.substring(0, 100));
    console.log('  WorkflowName:', p.task?.workflow?.name?.substring(0, 50));
  }

  // DriftAnalysis detail
  const drift = await db.driftAnalysis.findFirst({ 
    include: { 
      oldVersion: { include: { artifact: true } }, 
      newVersion: { include: { artifact: true } } 
    } 
  });
  if (drift) {
    console.log('\n=== DRIFT ANALYSIS ===');
    console.log('WorkflowId:', drift.workflowId, '| ChangeType:', drift.changeType);
    console.log('OldVersion artifact:', drift.oldVersion?.artifact?.type, '| workflowId:', drift.oldVersion?.artifact?.workflowId);
    console.log('NewVersion artifact:', drift.newVersion?.artifact?.type, '| workflowId:', drift.newVersion?.artifact?.workflowId);
    console.log('Same workflow:', drift.workflowId === drift.oldVersion?.artifact?.workflowId);
  } else {
    console.log('\n=== NO DRIFT ANALYSES FOUND ===');
  }

  // Validation report deep check
  const valReport = await db.validationReport.findFirst({ 
    include: { 
      issues: true,
      version: { include: { artifact: { include: { workflow: true } } } }
    } 
  });
  if (valReport) {
    console.log('\n=== VALIDATION REPORT ===');
    console.log('WorkflowId:', valReport.workflowId);
    console.log('Via Version->Artifact->Workflow:', valReport.version?.artifact?.workflow?.id);
    console.log('Match:', valReport.workflowId === valReport.version?.artifact?.workflow?.id);
    console.log('Score:', valReport.overallScore, '| Issues:', valReport.issues.length);
    for (const iss of valReport.issues) {
      console.log('  Issue:', iss.severity, '-', iss.title.substring(0, 60));
    }
  }
}
main().catch(e => console.error('ERROR:', e.message)).finally(() => db.$disconnect());
