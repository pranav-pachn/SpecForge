import { PrismaClient } from '@prisma/client';

export const e2eDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

export async function clearE2EDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Never run clearE2EDatabase in production!');
  }
  
  // Be careful with deletion order for foreign keys
  await e2eDb.task.deleteMany();
  await e2eDb.workflow.deleteMany();
  await e2eDb.project.deleteMany();
  await e2eDb.organization.deleteMany();
  await e2eDb.user.deleteMany();
}
