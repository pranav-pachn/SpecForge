const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { orgMemberships: true, projectMemberships: true } });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const orgs = await prisma.organization.findMany({ include: { projects: true, members: true } });
  console.log("ORGS:", JSON.stringify(orgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
