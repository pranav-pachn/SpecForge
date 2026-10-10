import { db } from "@/platform/storage/db";
import { WorkflowContext } from "../engine/WorkflowContext";
import { EmbeddingQueue } from "@/context/embeddings/EmbeddingQueue";
import { PlatformEventBus } from '@/platform/events/PlatformEventBus';
import { EventFactory } from '@/platform/events/factory/EventFactory';
import { EventPublisher } from '@/platform/events/dispatcher/EventPublisher';
import { GraphBuilder } from '@/intelligence/graph/GraphBuilder';
import { engineeringReviewStatus } from "@/infrastructure/services/analysis-engine";
import { planQuestionMerge } from "@/workflow/clarifications/mergeQuestions";



export async function persistPipelineArtifacts(ctx: WorkflowContext, publisher: EventPublisher = PlatformEventBus.getPublisher()): Promise<void> {
  const eventsToPublish: any[] = [];
  let specVersionId: string | null = null;

  await db.$transaction(async (tx) => {
    // 1. SPEC

    if (ctx.artifacts.spec) {
      const specContent = ctx.artifacts.spec.markdown;
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
        ctx.artifacts.spec
      );

      EmbeddingQueue.push({
        workflowId: ctx.input.workflowId,
        artifactType: "SPEC",
        artifactId: specArtifact.id,
        version: specArtifact.versions ? (specArtifact.versions[0]?.version || 0) + 1 : 1,
        content: specContent,
      });

      const oldQuestions = await tx.clarificationQuestion.findMany({
        where: { versionId: specArtifact.versions[0]?.id }
      });
      if (oldQuestions.length > 0) {
        await tx.clarificationQuestion.updateMany({
          where: {
            id: { in: oldQuestions.map((q: any) => q.id) }
          },
          data: {
            versionId: specVersionId as string
          }
        });
      }
    }
    
    if (ctx.artifacts.spec_review && specVersionId) {
      for (const check of ctx.artifacts.spec_review.checks) {
        await tx.reviewCheck.create({
          data: {
            versionId: specVersionId,
            type: check.type,
            status: check.status,
            description: check.description
          }
        });
      }
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

    if (ctx.artifacts.clarify && planVersionId) {
      const questions = ctx.artifacts.clarify.questions || [];
      const existing = await tx.clarificationQuestion.findMany({
        where: { versionId: planVersionId },
      });
      const merge = planQuestionMerge(existing, questions);
      if (merge.deleteIds.length > 0) {
        await tx.clarificationQuestion.deleteMany({
          where: { id: { in: merge.deleteIds } },
        });
      }
      for (const q of merge.create) {
        await tx.clarificationQuestion.create({
          data: {
            versionId: planVersionId,
            question: q.question,
            category: q.kind || q.category || "General",
            options: q.options || [],
            rationale: q.rationale || "",
            impact: q.impact || {},
            status: "OPEN",
          },
        });
      }
    }

    // 3. ARCHITECTURE
    if (ctx.artifacts.architect) {
      const archContent = JSON.stringify(ctx.artifacts.architect, null, 2);
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
    if (ctx.artifacts.tasks) {
      // Idempotency: Clear existing tasks for this workflow before re-generating
      await tx.taskDependency.deleteMany({
        where: { task: { workflowId: ctx.input.workflowId } }
      });
      await tx.executionPack.deleteMany({
        where: { task: { workflowId: ctx.input.workflowId } }
      });
      await tx.task.deleteMany({
        where: { workflowId: ctx.input.workflowId }
      });

      const tasksMap = new Map<string, any>();
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
       
       const findingsToCreate: any[] = [];
       for (const [category, data] of Object.entries(ctx.artifacts.review.categories)) {
         for (const item of (data as any).items) {
           if (item.issue) {
             findingsToCreate.push({
               category,
               severity: item.issue.priority.toLowerCase(),
               title: item.issue.finding,
               description: item.issue.suggestion,
               resolved: false
             });
           }
         }
       }
       
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
           status: engineeringReviewStatus(ctx.artifacts.review),
           coverageData: JSON.stringify(ctx.artifacts.review.categories.coverage),
           testingData: JSON.stringify(ctx.artifacts.review.categories.testing),
           securityData: JSON.stringify(ctx.artifacts.review.categories.security),
           performanceData: JSON.stringify(ctx.artifacts.review.categories.performance),
           architectureData: JSON.stringify(ctx.artifacts.review.categories.architecture),
           deploymentData: JSON.stringify(ctx.artifacts.review.categories.deployment),
           findings: {
             create: findingsToCreate
           }
         }
       });
    }

    const hasTasksCount = await tx.task.count({ where: { workflowId: ctx.input.workflowId } });
    const hasExecutionPacksCount = await tx.executionPack.count({
      where: { task: { workflowId: ctx.input.workflowId } }
    });

    // 6. Update workflow status
    let finalStatus = "VALIDATING";
    if (ctx.artifacts.clarify && !ctx.artifacts.spec) {
      finalStatus = "CLARIFYING";
    } else if (hasTasksCount > 0 && hasExecutionPacksCount === 0) {
      finalStatus = "TASK_BREAKDOWN";
    }
    
    await tx.workflow.update({
      where: { id: ctx.input.workflowId },
      data: { status: finalStatus as any }
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
