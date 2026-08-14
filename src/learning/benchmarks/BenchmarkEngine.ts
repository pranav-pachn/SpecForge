import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { GlobalBenchmarkSettings, BenchmarkConfig } from '../config/BenchmarkConfig';
import { StatisticalEvaluator } from './StatisticalEvaluator';
import { SafetyEvaluator } from './SafetyEvaluator';
import { DatasetManager } from './DatasetManager';
import { BenchmarkRunner } from './runners/BenchmarkRunner';

const prisma = new PrismaClient();

export class BenchmarkEngine {
  private statEval = new StatisticalEvaluator();
  private safetyEval = new SafetyEvaluator();
  private dataManager = new DatasetManager();
  private runner = new BenchmarkRunner();

  async runBenchmarks(forceImprovementMock = true, forceSafetyFailure = false): Promise<void> {
    
    // Find recommendations that have at least one IMPROVED experiment
    const recommendations = await prisma.learningRecommendation.findMany({
      where: {
        status: 'PROPOSED',
        experiments: {
          some: {
            result: 'IMPROVED'
          }
        }
      },
      include: {
        experiments: true
      }
    });

    if (recommendations.length === 0) {
      console.log('No eligible PROPOSED recommendations with IMPROVED experiments.');
      return;
    }

    console.log(`\n=== Running Benchmark Engine on ${recommendations.length} Candidates ===`);

    let completed = 0;
    let failed = 0;
    let reused = 0;

    for (const rec of recommendations) {
      const type = rec.type;
      const proposedChange = typeof rec.proposedChange === 'string' ? JSON.parse(rec.proposedChange) : rec.proposedChange as any;
      
      const primaryMetric = type.includes('PROMPT') ? 'validationScore' : 'latencyMs';
      
      const targetAgent = proposedChange.target?.id || 'default';
      const datasets = this.dataManager.resolveDatasets(targetAgent);
      
      for (const dataset of datasets) {
        const candidateString = proposedChange.candidate ? JSON.stringify(proposedChange.candidate) : 'none';
        const fingerprint = this.hash(`${rec.id}:${dataset.datasetId}:${dataset.version}:${candidateString}`);

        const existing = await prisma.learningBenchmark.findUnique({
          where: { fingerprint }
        });

        let benchmark;
        if (existing) {
          reused++;
          benchmark = existing;
          if (existing.status !== 'PENDING' && existing.status !== 'FAILED') {
            continue; // Already processed
          }
        } else {
          benchmark = await prisma.learningBenchmark.upsert({
            where: { fingerprint },
            update: {},
            create: {
              recommendationId: rec.id,
              status: 'PENDING',
              datasetId: dataset.datasetId,
              datasetVersion: dataset.version,
              runCount: 0,
              targetRunCount: GlobalBenchmarkSettings.defaultTargetRuns,
              primaryMetric,
              fingerprint
            }
          });
        }

        try {
          await prisma.learningBenchmark.update({
            where: { id: benchmark.id },
            data: { status: 'RUNNING', startedAt: new Date() }
          });

          const { observations, aborted, abortReason } = await this.runner.runBatch(
            dataset.inputs,
            proposedChange.candidate,
            primaryMetric,
            forceImprovementMock,
            forceSafetyFailure
          );

          if (aborted) {
            await prisma.learningBenchmark.update({
              where: { id: benchmark.id },
              data: {
                status: 'ABORTED',
                result: 'REJECTED',
                runCount: observations.length,
                error: abortReason,
                completedAt: new Date()
              }
            });
            completed++;
            continue;
          }

          const statResult = this.statEval.evaluate(observations, primaryMetric);
          const guardrailResult = this.safetyEval.evaluate(observations, primaryMetric);

          let finalResult = 'INCONCLUSIVE';
          
          if (!guardrailResult.passed) {
            finalResult = 'REJECTED';
          } else if (statResult.isSignificant && statResult.isPractical) {
            finalResult = 'CONFIRMED';
          } else if (!statResult.isSignificant && statResult.improvement < 0) {
            finalResult = 'REJECTED'; 
          }

          await prisma.learningBenchmark.update({
            where: { id: benchmark.id },
            data: {
                status: 'COMPLETED',
                runCount: observations.length,
                statisticalResult: statResult.result as any,
                guardrailResult: guardrailResult as any,
                confidenceLevel: statResult.result.confidenceLevel,
                result: finalResult,
                completedAt: new Date()
            }
          });
          
          completed++;

        } catch (err: any) {
          await prisma.learningBenchmark.update({
            where: { id: benchmark.id },
            data: {
              status: 'FAILED',
              error: err.message,
              completedAt: new Date()
            }
          });
          failed++;
        }
      }
    }

    console.log(`\nBenchmarks Complete!`);
    console.log(`Candidates analyzed:  ${recommendations.length}`);
    console.log(`Benchmarks completed: ${completed}`);
    console.log(`Benchmarks failed:    ${failed}`);
    console.log(`Benchmarks reused:    ${reused}`);
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
