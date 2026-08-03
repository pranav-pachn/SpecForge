// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import { CapabilityFlags } from '../src/enterprise/flags/CapabilityFlags';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Workspace -> Organization migration...");

  const workspaces = await prisma.workspace.findMany({
    include: {
      members: true,
      projects: {
        include: { workflows: { include: { tasks: true, knowledgeNodes: true, engineeringMemories: true } } }
      }
    }
  });

  console.log(`Found ${workspaces.length} workspaces to migrate.`);

  let successCount = 0;
  let failureCount = 0;

  for (const workspace of workspaces) {
    try {
      console.log(`Migrating Workspace: ${workspace.name} (${workspace.id})`);

      // We need to find the "owner". In the old system, all WorkspaceMembers had role="MEMBER" by default.
      // We will assume the oldest member is the owner, or if no members, a dummy owner (shouldn't happen).
      const ownerId = workspace.members.length > 0 ? workspace.members.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0].userId : "system";

      // Create Organization
      const org = await prisma.organization.create({
        data: {
          name: workspace.name,
          slug: workspace.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6),
          ownerId: ownerId,
          plan: "FREE",
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        }
      });

      // Migrate Members
      for (const member of workspace.members) {
        await prisma.orgMember.create({
          data: {
            organizationId: org.id,
            userId: member.userId,
            role: member.userId === ownerId ? "OWNER" : "MEMBER",
            joinedAt: member.createdAt
          }
        });
      }

      // Seed Capability Flags
      await CapabilityFlags.seed(org.id, "FREE");

      // Migrate Projects and related workflows
      for (const project of workspace.projects) {
        // Update Project with org id
        await prisma.project.update({
          where: { id: project.id },
          data: { organizationId: org.id }
        });

        // Update Workflows
        for (const workflow of project.workflows) {
          await prisma.workflow.update({
            where: { id: workflow.id },
            data: { organizationId: org.id }
          });

          // Update Tasks
          for (const task of workflow.tasks) {
            await prisma.task.update({
              where: { id: task.id },
              data: { organizationId: org.id }
            });
          }

          // Update KnowledgeNodes
          for (const node of workflow.knowledgeNodes) {
            await prisma.knowledgeNode.update({
              where: { id: node.id },
              data: { organizationId: org.id }
            });
          }

          // Update EngineeringMemories
          for (const memory of workflow.engineeringMemories) {
            await prisma.engineeringMemory.update({
              where: { id: memory.id },
              data: { organizationId: org.id }
            });
          }
        }
      }

      console.log(`Successfully migrated Workspace ${workspace.id} -> Organization ${org.id}`);
      successCount++;
    } catch (error) {
      console.error(`Failed to migrate Workspace ${workspace.id}:`, error);
      failureCount++;
    }
  }

  console.log(`\nMigration completed. Success: ${successCount}, Failures: ${failureCount}`);

  // Migration Validator Step
  console.log("\nRunning Migration Validator...");
  let validationPassed = true;

  const totalProjects = await prisma.project.count();
  const projectsWithoutOrg = await prisma.project.count({ where: { organizationId: null } });

  const totalWorkflows = await prisma.workflow.count();
  const workflowsWithoutOrg = await prisma.workflow.count({ where: { organizationId: null } });

  const totalTasks = await prisma.task.count();
  const tasksWithoutOrg = await prisma.task.count({ where: { organizationId: null } });

  const totalKnowledgeNodes = await prisma.knowledgeNode.count();
  const knowledgeNodesWithoutOrg = await prisma.knowledgeNode.count({ where: { organizationId: null } });

  if (projectsWithoutOrg > 0 || workflowsWithoutOrg > 0 || tasksWithoutOrg > 0 || knowledgeNodesWithoutOrg > 0) {
    console.error("VALIDATION FAILED: Some core entities are missing an organizationId.");
    console.error(`- Projects missing: ${projectsWithoutOrg}/${totalProjects}`);
    console.error(`- Workflows missing: ${workflowsWithoutOrg}/${totalWorkflows}`);
    console.error(`- Tasks missing: ${tasksWithoutOrg}/${totalTasks}`);
    console.error(`- KnowledgeNodes missing: ${knowledgeNodesWithoutOrg}/${totalKnowledgeNodes}`);
    validationPassed = false;
  }

  if (failureCount > 0) {
    console.error("VALIDATION FAILED: There were migration errors.");
    validationPassed = false;
  }

  if (validationPassed) {
    console.log("VALIDATION PASSED! It is now safe to remove the Workspace models.");
  } else {
    console.error("DO NOT DELETE WORKSPACE MODELS YET.");
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
