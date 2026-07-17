const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const workflowId = 'cmrnmwc250002102djgfcero8';
  
  // Find the PLAN artifact
  const planArtifact = await prisma.artifact.findFirst({
    where: { workflowId, type: 'PLAN' },
    include: { versions: { orderBy: { version: 'desc' } } }
  });
  
  if (planArtifact && planArtifact.versions.length > 0) {
    const latestVersion = planArtifact.versions[0];
    
    // Update its content
    await prisma.artifactVersion.update({
      where: { id: latestVersion.id },
      data: { 
        content: '# Implementation Plan\n\n## 1. Components\n- ThemeSwitcher.tsx\n\n## 2. API\n- /api/theme\n\nThis is a recovered implementation plan.' 
      }
    });
    console.log('Updated PLAN artifact content for workflow', workflowId);
  } else {
    console.log('No PLAN artifact found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
