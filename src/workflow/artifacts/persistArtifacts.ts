import { db } from "@/platform/storage/db";
import { WorkflowContext } from "../engine/WorkflowContext";
import { EmbeddingQueue } from "@/context/embeddings/EmbeddingQueue";
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';
import { EventFactory } from '@/platform/events/factory/EventFactory';
import { EventPublisher } from '@/platform/events/dispatcher/EventPublisher';
import { GraphBuilder } from '@/intelligence/graph/GraphBuilder';



export async function persistPipelineArtifacts(ctx: WorkflowContext, publisher: EventPublisher = PlatformEventBus.getPublisher()): Promise<void> {
  const eventsToPublish: any[] = [];
  let specVersionId: string | null = null;

  await db.$transaction(async (tx) => {
    // 1. SPEC

    if (ctx.artifacts.specification) {
      const specContent = ctx.artifacts.specification.markdown;
      let specArtifact = await tx.artifact.findFirst({
        where: { workflowId: ctx.input.workflowId, type: "SPEC" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      const oldSpecContent = specArtifact ? specArtifact.versions[0]?.content || null : null;
      if (!specArtifact) {
        specArtifact = await tx.artifact.create({
          data: {
            workflowId: ctx.input.workflowId,
            type: "SPEC",
            title: "Product Specification",
            versions: {
              create: {
                version: 1,
                content: specContent,
                status: "APPROVED",
              }
            }
          },
          include: { versions: true }
        });
        specVersionId = specArtifact.versions[0].id;
      } else {
        const nextVersion = (specArtifact.versions[0]?.version || 0) + 1;
        const v = await tx.artifactVersion.create({
          data: {
            artifactId: specArtifact.id,
            version: nextVersion,
            content: specContent,
            status: "APPROVED",
          }
        });
        specVersionId = v.id;
      }

      eventsToPublish.push(EventFactory.specificationCreated({
        artifactId: specArtifact.id,
        versionId: specVersionId as string,
        content: specContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));

      // Build graph from structured object
      await GraphBuilder.buildFromArtifact(
        ctx.input.workflowId, 
        "SPEC", 
        specArtifact.id, 
        specArtifact.versions ? (specArtifact.versions[0]?.version || 0) + 1 : 1, 
        ctx.artifacts.specification
      );

      EmbeddingQueue.push({
        workflowId: ctx.input.workflowId,
        artifactType: "SPEC",
        artifactId: specArtifact.id,
        version: specArtifact.versions ? (specArtifact.versions[0]?.version || 0) + 1 : 1,
        content: specContent,
      });
    }

    // 2. PLAN
    let planVersionId: string | null = null;
    if (ctx.artifacts.planning) {
      const planContent = JSON.stringify(ctx.artifacts.planning, null, 2);
      let planArtifact = await tx.artifact.findFirst({
        where: { workflowId: ctx.input.workflowId, type: "PLAN" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      const oldPlanContent = planArtifact ? planArtifact.versions[0]?.content || null : null;
      if (!planArtifact) {
        planArtifact = await tx.artifact.create({
          data: {
            workflowId: ctx.input.workflowId,
            type: "PLAN",
            title: "Implementation Plan",
            versions: {
              create: {
                version: 1,
                content: planContent,
                status: "APPROVED",
              }
            }
          },
          include: { versions: true }
        });
        planVersionId = planArtifact.versions[0].id;
      } else {
        const nextVersion = (planArtifact.versions[0]?.version || 0) + 1;
        const v = await tx.artifactVersion.create({
          data: {
            artifactId: planArtifact.id,
            version: nextVersion,
            content: planContent,
            status: "APPROVED",
          }
        });
        planVersionId = v.id;
      }

      

      EmbeddingQueue.push({
        workflowId: ctx.input.workflowId,
        artifactType: "PLAN",
        artifactId: planArtifact.id,
        version: planArtifact.versions ? (planArtifact.versions[0]?.version || 0) + 1 : 1,
        content: planContent,
      });
    }

    // 3. ARCHITECTURE
    if (ctx.artifacts.architecture) {
      const archContent = JSON.stringify(ctx.artifacts.architecture, null, 2);
      let archArtifact = await tx.artifact.findFirst({
        where: { workflowId: ctx.input.workflowId, type: "ARCHITECTURE" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      const oldArchContent = archArtifact ? archArtifact.versions[0]?.content || null : null;
      let archVersionId: string | null = null;
      
      if (!archArtifact) {
        archArtifact = await tx.artifact.create({
          data: {
            workflowId: ctx.input.workflowId,
            type: "ARCHITECTURE",
            title: "System Architecture",
            versions: {
              create: {
                version: 1,
                content: archContent,
                status: "APPROVED",
              }
            }
          },
          include: { versions: true }
        });
        archVersionId = archArtifact.versions[0].id;
      } else {
        const nextVersion = (archArtifact.versions[0]?.version || 0) + 1;
        const v = await tx.artifactVersion.create({
          data: {
            artifactId: archArtifact.id,
            version: nextVersion,
            content: archContent,
            status: "APPROVED",
          }
        });
        archVersionId = v.id;
      }

      eventsToPublish.push(EventFactory.architectureGenerated({
        artifactId: archArtifact.id,
        versionId: archVersionId as string,
        content: archContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));

      EmbeddingQueue.push({
        workflowId: ctx.input.workflowId,
        artifactType: "ARCHITECTURE",
        artifactId: archArtifact.id,
        version: archArtifact.versions ? (archArtifact.versions[0]?.version || 0) + 1 : 1,
        content: archContent,
      });
    }

    // 4. TASKS
    if (ctx.artifacts.tasks && ctx.artifacts.tasks.tasks) {
      await tx.task.deleteMany({ where: { workflowId: ctx.input.workflowId } });
      const tasksMap = new Map();

      for (const t of ctx.artifacts.tasks.tasks) {
        const created = await tx.task.create({
          data: {
            workflowId: ctx.input.workflowId,
            versionId: planVersionId as string,
            title: t.title,
            description: t.description,
            acceptanceCriteria: Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n') : t.acceptanceCriteria,
            verificationNotes: Array.isArray(t.verificationNotes) ? t.verificationNotes.map((c: string) => `- ${c}`).join('\n') : t.verificationNotes,
            priority: t.priority || 2,
            order: t.order || 0,
            status: "TODO",
            complexity: t.complexity,
            requirements: t.requirements || [],
          },
        });
        tasksMap.set(t.title, created);
      }

      for (const t of ctx.artifacts.tasks.tasks) {
        if (t.dependencies && t.dependencies.length > 0) {
          const currentTask = tasksMap.get(t.title);
          for (const depTitle of t.dependencies) {
            const dependsOnTask = tasksMap.get(depTitle);
            if (currentTask && dependsOnTask) {
              await tx.taskDependency.create({
                data: {
                  taskId: currentTask.id,
                  dependsOnId: dependsOnTask.id,
                }
              });
            }
          }
        }
      }

      const taskContent = JSON.stringify(ctx.artifacts.tasks.tasks, null, 2);
      let breakdownArtifact = await tx.artifact.findFirst({
        where: { workflowId: ctx.input.workflowId, type: "TASK_BREAKDOWN" },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      const oldTaskContent = breakdownArtifact ? breakdownArtifact.versions[0]?.content || null : null;
      let taskVersionId: string | null = null;
      
      if (!breakdownArtifact) {
        breakdownArtifact = await tx.artifact.create({
          data: {
            workflowId: ctx.input.workflowId,
            type: "TASK_BREAKDOWN",
            title: "Task Breakdown",
            versions: {
              create: {
                version: 1,
                content: taskContent,
                status: "APPROVED",
              }
            }
          },
          include: { versions: true }
        });
        taskVersionId = breakdownArtifact.versions[0].id;
      } else {
        const nextVersion = (breakdownArtifact.versions[0]?.version || 0) + 1;
        const v = await tx.artifactVersion.create({
          data: {
            artifactId: breakdownArtifact.id,
            version: nextVersion,
            content: taskContent,
            status: "APPROVED",
          }
        });
        taskVersionId = v.id;
      }

      eventsToPublish.push(EventFactory.tasksGenerated({
        artifactId: breakdownArtifact.id,
        versionId: taskVersionId as string,
        content: taskContent
      }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId }));

      EmbeddingQueue.push({
        workflowId: ctx.input.workflowId,
        artifactType: "TASK_BREAKDOWN",
        artifactId: breakdownArtifact.id,
        version: breakdownArtifact.versions ? (breakdownArtifact.versions[0]?.version || 0) + 1 : 1,
        content: taskContent,
      });
    }
    
    // 5. REVIEW
    if (ctx.artifacts.review && specVersionId) {
       await tx.engineeringReview.deleteMany({
          where: { versionId: specVersionId }
       });
       
       const newReview = await tx.engineeringReview.create({
         data: {
           workflowId: ctx.input.workflowId,
           versionId: specVersionId,
           overallScore: ctx.artifacts.review.overallScore,
           coverageScore: ctx.artifacts.review.categories.coverage.score,
           testingScore: ctx.artifacts.review.categories.testing.score,
           securityScore: ctx.artifacts.review.categories.security.score,
           performanceScore: ctx.artifacts.review.categories.performance.score,
           architectureScore: ctx.artifacts.review.categories.architecture.score,
           deploymentScore: ctx.artifacts.review.categories.deployment.score,
           rollbackScore: ctx.artifacts.review.categories.rollback.score,
           status: ctx.artifacts.review.overallScore >= 80 ? "READY" : "NEEDS_ATTENTION",
           coverageData: JSON.stringify(ctx.artifacts.review.categories.coverage),
           testingData: JSON.stringify(ctx.artifacts.review.categories.testing),
           securityData: JSON.stringify(ctx.artifacts.review.categories.security),
           performanceData: JSON.stringify(ctx.artifacts.review.categories.performance),
           architectureData: JSON.stringify(ctx.artifacts.review.categories.architecture),
           deploymentData: JSON.stringify(ctx.artifacts.review.categories.deployment),
         }
       });
       
       // Add findings (for simplicity in MVP, we can leave the nested issues inside the JSON fields)
    }

    // 6. Update workflow status
    await tx.workflow.update({
      where: { id: ctx.input.workflowId },
      data: { status: "VALIDATING" }
    });
  }, { timeout: 30000 });

  // Execute Memory Jobs asynchronously (fire-and-forget)
  // This allows the workflow engine to proceed while LLMs analyze the decisions
  for (const event of eventsToPublish) {
    publisher.publish(event).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }
  
  // Publish ReviewCompleted if review artifact exists
  if (ctx.artifacts.review && specVersionId) { 
    publisher.publish(EventFactory.reviewCompleted({
      reviewId: "review-" + Date.now(), 
      overallScore: ctx.artifacts.review.overallScore
    }, { workflowId: ctx.input.workflowId, userId: ctx.input.userId })).catch(e => console.error("[PlatformEventBus] Publish failed:", e));
  }
}
