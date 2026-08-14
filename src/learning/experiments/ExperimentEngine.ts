import { PrismaClient } from '@prisma/client';
import { PromptExperimentRunnerInterface, WorkflowExperimentRunnerInterface } from './runners/ExperimentRunnerInterfaces';
import { PromptExperimentRunner } from './runners/PromptExperimentRunner';
import { WorkflowExperimentRunner } from './runners/WorkflowExperimentRunner';
import { ExperimentComparator } from './ExperimentComparator';
import { ExperimentMetrics, ExperimentType, ExperimentResult } from '../models/LearningExperiment';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ExperimentEngine {
  private promptRunner: PromptExperimentRunnerInterface;
  private workflowRunner: WorkflowExperimentRunnerInterface;
  private comparator = new ExperimentComparator();

  constructor(
    promptRunner?: PromptExperimentRunnerInterface,
    workflowRunner?: WorkflowExperimentRunnerInterface
  ) {
    this.promptRunner = promptRunner || new PromptExperimentRunner();
    this.workflowRunner = workflowRunner || new WorkflowExperimentRunner();
  }

  async runExperiments(): Promise<void> {
    const recommendations = await prisma.learningRecommendation.findMany({
      where: {
        status: 'PROPOSED'
      }
    });

    if (recommendations.length === 0) {
      console.log('No PROPOSED recommendations eligible for experiments.');
      return;
    }

    console.log(`\n=== Running Experiment Engine on ${recommendations.length} Recommendations ===`);

    let completed = 0;
    let failed = 0;
    let reused = 0;

    for (const rec of recommendations) {
      const type = rec.type;
      const proposedChange = typeof rec.proposedChange === 'string' ? JSON.parse(rec.proposedChange) : rec.proposedChange as any;
      
      let experimentType: ExperimentType = 'PROMPT';
      let primaryMetric: keyof ExperimentMetrics = 'validation';

      if (type.includes('PROMPT')) {
        experimentType = 'PROMPT';
        primaryMetric = 'validation';
      } else if (type.includes('WORKFLOW') || type.includes('INVESTIGATION')) {
        experimentType = 'WORKFLOW';
        primaryMetric = 'latencyMs';
      }

      // Generate fingerprint for this specific experiment setup
      const candidateString = proposedChange.candidate ? JSON.stringify(proposedChange.candidate) : 'none';
      const fingerprint = this.hash(`${rec.id}:${experimentType}:${candidateString}:v1-dataset`);

      // Check idempotency
      const existing = await prisma.learningExperiment.findUnique({
        where: { fingerprint }
      });

      if (existing) {
         reused++;
         continue; // Already ran this exact experiment
      }

      // 1. Create PENDING Experiment
      const experiment = await prisma.learningExperiment.create({
        data: {
          recommendationId: rec.id,
          status: 'PENDING',
          experimentType,
          primaryMetric,
          fingerprint
        }
      });

      try {
        // 2. Transition to RUNNING
        await prisma.learningExperiment.update({
          where: { id: experiment.id },
          data: { status: 'RUNNING', startedAt: new Date() }
        });

        // 3. Execute Control + Candidate simultaneously
        let control: ExperimentMetrics;
        let candidate: ExperimentMetrics;

        if (experimentType === 'PROMPT') {
           const targetId = proposedChange.target.id;
           const candidatePrompt = proposedChange.candidate?.prompt || 'dummy';
           
           const res = await this.promptRunner.runTargetedExperiment(targetId, candidatePrompt);
           control = res.control;
           candidate = res.candidate;
        } else {
           const res = await this.workflowRunner.runShadowExperiment(proposedChange.candidate?.configuration || {});
           control = res.control;
           candidate = res.candidate;
        }

        // 4. Compare
        const { comparison, result } = this.comparator.compare(control, candidate, primaryMetric);

        // 5. Complete
        await prisma.learningExperiment.update({
           where: { id: experiment.id },
           data: {
              status: 'COMPLETED',
              controlMetrics: control as any,
              candidateMetrics: candidate as any,
              comparison: comparison as any,
              result,
              completedAt: new Date()
           }
        });
        
        completed++;

      } catch (err: any) {
        // Handle failure safely without touching Prod
        await prisma.learningExperiment.update({
          where: { id: experiment.id },
          data: {
            status: 'FAILED',
            error: err.message,
            completedAt: new Date()
          }
        });
        failed++;
      }
      
      // Note: We DO NOT update LearningRecommendation.status = ACCEPTED
      // It remains PROPOSED as requested.
    }

    console.log(`\nExperiments Complete!`);
    console.log(`Recommendations analyzed:  ${recommendations.length}`);
    console.log(`Experiments completed:     ${completed}`);
    console.log(`Experiments failed:        ${failed}`);
    console.log(`Experiments reused:        ${reused}`);
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
