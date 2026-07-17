const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const workflow = await prisma.workflow.findUnique({
    where: { id: 'cmrnmwc250002102djgfcero8' },
    include: { artifacts: { include: { versions: true } } }
  });
  console.log(JSON.stringify(workflow.artifacts.find(a => a.type === 'PLAN'), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
