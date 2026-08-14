import { PrismaClient, LearningRecommendation, LearningBenchmark } from '@prisma/client';
import crypto from 'crypto';
import { RulesetEvaluator } from './RulesetEvaluator';
import { DecisionEvidenceBuilder } from './DecisionEvidenceBuilder';
import { DecisionConfig } from '../config/DecisionConfig';

const prisma = new PrismaClient();

export class DecisionEngine {
  private ruleset = new RulesetEvaluator();
  private evidenceBuilder = new DecisionEvidenceBuilder();

  async runDecisions(policyName: string = 'AUTO_ACCEPT_V1'): Promise<void> {
    const policy = DecisionConfig[policyName];
    if (!policy) throw new Error(`Policy not found: ${policyName}`);

    // We only evaluate PROPOSED recommendations that have completed/aborted benchmarks.
    // In practice, we should make sure *all* target benchmarks for the recommendation are finished.
    // For simplicity, we just check if it has benchmarks and is still PROPOSED.
    const recommendations = await prisma.learningRecommendation.findMany({
      where: {
        status: 'PROPOSED',
        benchmarks: {
           some: {} // has at least one benchmark
        }
      },
      include: {
        benchmarks: true
      }
    });

    if (recommendations.length === 0) {
      console.log('No eligible PROPOSED recommendations with benchmarks to decide on.');
      return;
    }

    console.log(`\n=== Running Decision Engine on ${recommendations.length} Recommendations ===`);

    let accepted = 0;
    let rejected = 0;
    let reviewed = 0;
    let reused = 0;

    for (const rec of recommendations) {
      const benchmarks = rec.benchmarks.filter(b => b.status === 'COMPLETED' || b.status === 'ABORTED');

      if (benchmarks.length === 0) {
        continue;
      }

      // Check if decision already exists for this fingerprint
      // fingerprint: rec.id + sorted benchmark fingerprints + policy
      const benchFingerprints = benchmarks.map(b => b.fingerprint).sort().join('-');
      const fingerprint = this.hash(`${rec.id}:${benchFingerprints}:${policyName}`);

      const existingDecision = await prisma.learningDecision.findUnique({
         where: { fingerprint }
      });

      if (existingDecision) {
         reused++;
         // Also update recommendation status to DECIDED if it isn't
         if (rec.status !== 'DECIDED') {
            await prisma.learningRecommendation.update({
               where: { id: rec.id },
               data: { status: 'DECIDED' }
            });
         }
         continue;
      }

      const { decision, rationale } = this.ruleset.evaluate(benchmarks, policyName);
      const evidence = this.evidenceBuilder.build(benchmarks);

      // Create LearningDecision using upsert
      await prisma.learningDecision.upsert({
         where: { recommendationId: rec.id },
         update: {},
         create: {
            recommendationId: rec.id,
            decision,
            decisionSource: 'AUTOMATED',
            policyVersion: policyName,
            rationale,
            evidence: evidence as any,
            fingerprint
         }
      });

      // Update recommendation status to DECIDED
      await prisma.learningRecommendation.update({
         where: { id: rec.id },
         data: { status: 'DECIDED' }
      });

      if (decision === 'ACCEPTED') accepted++;
      else if (decision === 'REJECTED') rejected++;
      else if (decision === 'NEEDS_REVIEW') reviewed++;
    }

    console.log(`\nDecisions Complete!`);
    console.log(`Recommendations analyzed:  ${recommendations.length}`);
    console.log(`Decisions ACCEPTED:        ${accepted}`);
    console.log(`Decisions REJECTED:        ${rejected}`);
    console.log(`Decisions NEEDS_REVIEW:    ${reviewed}`);
    console.log(`Decisions reused:          ${reused}`);
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}

