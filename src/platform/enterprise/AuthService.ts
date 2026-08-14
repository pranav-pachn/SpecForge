import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Handles user session validation, login, and org resolution.
   */
  async validateSession(token: string): Promise<User | null> {
    // In a real implementation, this would verify a JWT or session cookie
    // against an identity provider (Auth0, Clerk, Supabase, NextAuth)
    return prisma.user.findFirst(); // Stub
  }

  async resolveContext(userId: string, organizationId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const orgMember = await prisma.orgMember.findFirst({
      where: { 
        userId, 
        organizationId: organizationId || undefined 
      },
      include: { organization: true }
    });

    return {
      user,
      organization: orgMember?.organization || null,
      role: orgMember?.role || null
    };
  }
}
