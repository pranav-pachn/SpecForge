import { PrismaClient, StoredEvent, PromptEvaluation, EvaluationRun, BenchmarkResult } from '@prisma/client';
import { LearningExecution, LearningStage, LearningFailure, PromptUsage, LearningSourceProvenance } from '../models/LearningExecution';

const prisma = new PrismaClient();

export class LearningDataPipeline {
  async ingestExecutions(limit?: number, workflowId?: string, since?: Date): Promise<void> {
    // 1. Identify distinct execution traces
    let query: any = {
      select: { workflowId: true },
      distinct: ['workflowId']
    };
    
    if (workflowId) {
      query.where = { ...query.where, workflowId };
    }
    
    if (since) {
      query.where = { ...query.where, occurredAt: { gte: since } };
    }

    const traces = await prisma.storedEvent.findMany(query);
    
    // We will map each workflow to an 'executionId' for now, assuming 1:1 workflow execution
    // Later phases will differentiate multiple executions within the same workflow.
    
    let processed = 0;
    let ingested = 0;
    let skipped = 0;
    const SCHEMA_VERSION = 1;

    for (const trace of traces) {
      if (limit && processed >= limit) break;
      
      const wid = trace.workflowId;
      if (!wid) continue;
      
      // executionId is mapped to workflowId for now as this represents the run
      const executionId = wid;
      
      // Check idempotency
      const existing = await prisma.learningExecution.findUnique({
        where: {
          executionId_schemaVersion: {
            executionId,
            schemaVersion: SCHEMA_VERSION
          }
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      try {
        const learningData = await this.normalizeWorkflow(wid, executionId, SCHEMA_VERSION);
        if (!learningData) continue;
        
        await prisma.learningExecution.create({
          data: {
            executionId: learningData.executionId,
            workflowId: learningData.workflowId,
            startedAt: learningData.startedAt,
            completedAt: learningData.completedAt,
            success: learningData.success,
            confidence: learningData.confidence,
            risk: learningData.risk,
            totalDurationMs: learningData.totalDurationMs,
            repairCount: learningData.repairCount,
            benchmarkScore: learningData.benchmarkScore,
            stages: learningData.stages as any,
            failures: learningData.failures as any,
            prompts: learningData.prompts as any,
            source: learningData.source as any,
            schemaVersion: learningData.schemaVersion
          }
        });
        
        ingested++;
      } catch (err) {
        console.error(`[LearningDataPipeline] Failed to ingest workflow ${wid}:`, err);
      }
      
      processed++;
    }
    
    console.log(`\n=== Ingestion Report ===`);
    console.log(`Executions discovered:       ${traces.length}`);
    console.log(`Executions ingested:         ${ingested}`);
    console.log(`Already ingested:            ${skipped}`);
    if (ingested > 0) {
      console.log(`\n✓ Ingestion complete`);
    } else {
      console.log(`\n✓ No duplicates created`);
    }
  }
  
  async normalizeWorkflow(workflowId: string, executionId: string, schemaVersion: number): Promise<LearningExecution | null> {
    const events = await prisma.storedEvent.findMany({
      where: { workflowId },
      orderBy: { occurredAt: 'asc' }
    });
    
    if (events.length === 0) return null;
    
    const startedAt = events[0].occurredAt;
    let completedAt: Date | undefined;
    let success = false;
    let totalDurationMs: number | undefined;
    
    const finalEvent = events[events.length - 1];
    if (finalEvent.type === 'EXECUTION_COMPLETED' || finalEvent.type === 'WORKFLOW_COMPLETED') {
      completedAt = finalEvent.occurredAt;
      success = true;
      totalDurationMs = completedAt.getTime() - startedAt.getTime();
    }
    
    // Normalize stages and failures
    const stages: LearningStage[] = [];
    const failures: LearningFailure[] = [];
    let repairCount = 0;
    
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.type.endsWith('_STARTED')) {
        const stageName = e.type.replace('_STARTED', '');
        // Find corresponding COMPLETED or FAILED
        const endEvent = events.find((ev, j) => j > i && (ev.type === `${stageName}_COMPLETED` || ev.type === `${stageName}_FAILED`));
        if (endEvent) {
          stages.push({
            name: stageName,
            durationMs: endEvent.occurredAt.getTime() - e.occurredAt.getTime(),
            success: endEvent.type.endsWith('_COMPLETED')
          });
          
          if (endEvent.type.endsWith('_FAILED')) {
            failures.push({
              stage: stageName,
              error: (endEvent.payload as any)?.error || 'Unknown error',
              severity: 'HIGH'
            });
          }
        }
      }
      
      if (e.type === 'REPAIR_COMPLETED' || e.type === 'REPAIR_FAILED') {
        repairCount++;
      }
    }
    
    // Prompts
    const promptEvals = await prisma.promptEvaluation.findMany({
      where: { workflowId },
      include: { variant: true }
    });
    
    const prompts: PromptUsage[] = promptEvals.map(evalRun => {
      repairCount += evalRun.repairAttempts; // Also count repair loops from evaluation
      return {
        variantId: evalRun.variantId,
        provider: evalRun.provider,
        model: evalRun.model,
        tokens: evalRun.promptTokens + evalRun.completionTokens,
        latencyMs: evalRun.latencyMs
      };
    });
    
    // Evaluations
    const evals = await prisma.evaluationRun.findMany({
      where: { workflowId }
    });
    
    let confidence = undefined;
    let risk = undefined;
    let evalRunId = undefined;
    
    if (evals.length > 0) {
      const avgOverall = evals.reduce((sum, e) => sum + e.overall, 0) / evals.length;
      confidence = avgOverall;
      risk = evals[0].riskLevel;
      evalRunId = evals[0].id;
    }
    
    const source: LearningSourceProvenance = {
      storedEvents: true,
      repairHistory: repairCount > 0,
      evaluationRun: evalRunId,
      benchmarkResult: undefined // To be mapped when benchmarks run on this workflow
    };

    return {
      executionId,
      workflowId,
      startedAt,
      completedAt,
      success,
      confidence,
      risk,
      totalDurationMs,
      repairCount,
      stages,
      failures,
      prompts,
      source,
      schemaVersion
    };
  }
}
