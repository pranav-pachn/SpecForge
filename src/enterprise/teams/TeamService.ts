import { db } from "@/lib/db";
import { TeamRole } from "@prisma/client";

export class TeamService {
  /**
   * Creates a new team within an organization.
   */
  static async createTeam(organizationId: string, name: string, description?: string) {
    return await db.team.create({
      data: {
        organizationId,
        name,
        description
      }
    });
  }

  /**
   * Adds a user to a team. The user must already be a member of the organization (enforced higher up).
   */
  static async addMember(teamId: string, userId: string, role: TeamRole = "MEMBER") {
    return await db.teamMember.create({
      data: {
        teamId,
        userId,
        role
      }
    });
  }

  /**
   * Removes a member from a team.
   */
  static async removeMember(teamId: string, userId: string) {
    await db.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId
        }
      }
    });
  }

  /**
   * Gets all teams within an organization.
   */
  static async getTeams(organizationId: string) {
    return await db.team.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });
  }

  /**
   * Gets all members of a specific team.
   */
  static async getTeamMembers(teamId: string) {
    return await db.teamMember.findMany({
      where: { teamId },
      include: { user: true }
    });
  }
}
