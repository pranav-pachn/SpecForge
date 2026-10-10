import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const userId = 'cmsshqsqe00006pmmhj2lb0rb';
  
  let org = await db.organization.findFirst({
    where: { ownerId: userId },
    include: { projects: true, members: { where: { userId: userId } } }
  });

  console.log('ORG:', org);

  if (!org) {
    console.log('NO ORG FOUND');
  } else if (org.members.length === 0) {
    console.log('CREATING MISSING MEMBER');
    try {
      const newMember = await db.orgMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: 'OWNER'
        }
      });
      console.log('CREATED MEMBER:', newMember);
    } catch (err) {
      console.error('ERROR CREATING MEMBER:', err);
    }
  }
}

main().finally(() => db.$disconnect());
