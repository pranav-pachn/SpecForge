import { PrismaClient, ProjectRole } from '@prisma/client';

const prisma = new PrismaClient();

export class ProjectService {
  async createProject(organizationId: string, name: string, description?: string) {
    return prisma.project.create({
      data: {
        organizationId,
        name,
        description
      }
    });
  }

  async addMember(projectId: string, userId: string, role: ProjectRole) {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role
      }
    });
  }

  async getProjectsForUser(userId: string, organizationId: string) {
    return prisma.project.findMany({
      where: {
        organizationId,
        members: {
          some: { userId }
        }
      }
    });
  }
}
