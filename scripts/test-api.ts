import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/workflows/route';
import { db } from '../src/platform/storage/db';

async function main() {
  const userId = 'user_has_org_' + Date.now();
  await db.user.create({ data: { id: userId, email: userId + '@test.com', name: 'Test User' } });

  const orgId = 'org_' + Date.now();
  await db.organization.create({
    data: {
      id: orgId,
      name: 'Test Org',
      slug: 'test-org-' + Date.now(),
      ownerId: userId,
      plan: 'FREE',
      members: {
        create: {
          userId,
          role: 'OWNER'
        }
      }
      // NOT creating any projects
    }
  });

  process.env.E2E_TEST_USER = JSON.stringify({ id: userId, email: userId + '@test.com' });
  const req = new NextRequest('http://localhost/api/workflows', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test WF 2', rawIdea: 'Hello world again' })
  });
  
  try {
    const res = await POST(req);
    console.log('STATUS:', res.status);
    console.log('BODY:', await res.text());
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await db.$disconnect();
  }
}

main();
