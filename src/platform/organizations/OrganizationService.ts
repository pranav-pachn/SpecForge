import { db } from "@/platform/storage/db";
import { OrgPlan, OrgRole } from "@prisma/client";
import { CapabilityFlags } from '@/platform/config/flags/CapabilityFlags';
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';

export class OrganizationService {
  /**
   * Creates a new organization, assigning the creator as OWNER.
   */
  static async create(name: string, slug: string, ownerId: string, plan: OrgPlan = "FREE") {
    // 1. Create Organization
    const org = await db.organization.create({
      data: {
        name,
        slug,
        ownerId,
        plan,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER"
          }
        }
      }
    });

    // 2. Seed Capability Flags for this plan
    await CapabilityFlags.seed(org.id, plan);

    // 3. Emit Domain Event
    await PlatformEventBus.emit("POLICY_CREATED", {
      orgId: org.id,
      userId: ownerId,
      entityType: "ORGANIZATION",
      entityId: org.id,
      timestamp: new Date(),
    });

    return org;
  }

  /**
   * Invites a user to the organization. 
   * In a real system, this would send an email and generate a token.
   */
  static async inviteMember(orgId: string, email: string, role: OrgRole = "MEMBER") {
    const invitation = await db.invitation.create({
      data: {
        organizationId: orgId,
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    await PlatformEventBus.emit("MEMBER_INVITED", {
      orgId,
      entityType: "INVITATION",
      entityId: invitation.id,
      timestamp: new Date(),
      metadata: { email, role }
    });

    return invitation;
  }

  /**
   * Accepts an invitation, adding the user to the organization.
   */
  static async acceptInvitation(token: string, userId: string) {
    const invitation = await db.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
      throw new Error("Invalid or expired invitation.");
    }

    const member = await db.orgMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role
      }
    });

    await db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    await PlatformEventBus.emit("MEMBER_JOINED", {
      orgId: invitation.organizationId,
      userId,
      entityType: "ORG_MEMBER",
      entityId: member.id,
      timestamp: new Date(),
    });

    return member;
  }

  /**
   * Removes a member from the organization.
   */
  static async removeMember(orgId: string, userId: string) {
    await db.orgMember.delete({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId
        }
      }
    });
  }

  /**
   * Gets all members of an organization.
   */
  static async getMembers(orgId: string) {
    return await db.orgMember.findMany({
      where: { organizationId: orgId },
      include: { user: true }
    });
  }
}
