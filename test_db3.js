const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  const workflow = await prisma.workflow.findUnique({
    where: { id: 'cmrnmwc250002102djgfcero8' },
    include: { artifacts: { include: { versions: true } } }
  });
  fs.writeFileSync('workflow_dump.json', JSON.stringify(workflow, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
