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
  if (process.env.ALLOW_E2E_DB_WIPE !== 'true') {
    throw new Error('Refusing to wipe the database. Set ALLOW_E2E_DB_WIPE=true against a disposable test database.');
  }
  const url = process.env.DATABASE_URL ?? '';
  if (!/(_test|e2e)/i.test(url)) {
    throw new Error('Refusing to wipe a database whose DATABASE_URL does not contain "_test" or "e2e".');
  }
  
  // Be careful with deletion order for foreign keys
  await e2eDb.task.deleteMany();
  await e2eDb.workflow.deleteMany();
  await e2eDb.project.deleteMany();
  await e2eDb.organization.deleteMany();
  await e2eDb.user.deleteMany();
}
