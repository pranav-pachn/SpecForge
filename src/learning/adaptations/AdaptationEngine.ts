import { PrismaClient, LearningDecision, LearningAdaptation } from '@prisma/client';
import { ProposedChange } from '../models/LearningRecommendation';
import { AdaptationHandler } from './handlers/AdaptationHandler';
import { PromptVariantHandler } from './handlers/PromptVariantHandler';
import { InvestigationAdaptationHandler } from './handlers/InvestigationAdaptationHandler';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AdaptationEngine {
  private handlers: AdaptationHandler[] = [
    new PromptVariantHandler(),
    new InvestigationAdaptationHandler()
  ];

  async runAdaptations(): Promise<void> {
    const decisions = await prisma.learningDecision.findMany({
      where: {
        decision: 'ACCEPTED',
        adaptation: null // only process ones without an existing adaptation record
      },
      include: {
        recommendation: true
      }
    });

    if (decisions.length === 0) {
      console.log('No new ACCEPTED decisions to adapt.');
      return;
    }

    console.log(`\n=== Running Adaptation Engine on ${decisions.length} Decisions ===`);

    for (const decision of decisions) {
      const change = decision.recommendation.proposedChange as unknown as ProposedChange;
      const targetKey = this.getTargetKey(change);
      const fingerprint = this.hash(`${decision.id}:${targetKey}`);

      // Idempotency Check
      const existing = await prisma.learningAdaptation.findUnique({
        where: { fingerprint }
      });

      if (existing) {
         console.log(`Adaptation already exists for decision ${decision.id}`);
         continue;
      }

      const handler = this.handlers.find(h => h.canHandle(change));
      if (!handler) {
         console.log(`No handler found for action type: ${change.action}`);
         continue;
      }

      const riskClass = this.classifyRisk(change);
      let status = 'PENDING';
      
      // If Risk is HIGH, we require human approval, so we keep it PENDING
      // If Risk is MEDIUM, we might canary it. For now we will mark it PENDING for canary framework.
      // If Risk is LOW, we auto apply.
      if (riskClass !== 'LOW') {
         // Auto-adaptation is only for LOW risk right now.
         console.log(`Decision ${decision.id} is risk class ${riskClass}. Manual or canary promotion required. Creating PENDING adaptation.`);
      }

      // We still validate and record it
      const validation = await handler.validate(change, prisma);
      
      if (!validation.valid) {
         console.log(`Validation failed for decision ${decision.id}: ${validation.reason}`);
         await this.recordAdaptation(decision.id, change.action, targetKey, 'FAILED', null, null, null, null, fingerprint);
         continue;
      }

      // Record the pending/validating state
      const adaptation = await this.recordAdaptation(
         decision.id, 
         change.action, 
         targetKey, 
         riskClass === 'LOW' ? 'APPLYING' : 'PENDING', 
         validation.previousState, 
         validation.newState, 
         null, 
         null, 
         fingerprint
      );

      if (riskClass === 'LOW') {
        const result = await handler.apply(change, prisma);
        if (result.success) {
           await prisma.learningAdaptation.update({
             where: { id: adaptation.id },
             data: {
                status: 'APPLIED',
                appliedAt: new Date(),
                appliedBy: 'SYSTEM',
                previousVersion: result.previousVersion,
                newVersion: result.newVersion
             }
           });
           console.log(`Successfully APPLIED adaptation for decision ${decision.id}`);
        } else {
           await prisma.learningAdaptation.update({
             where: { id: adaptation.id },
             data: { status: 'FAILED' }
           });
           console.log(`Failed to apply adaptation for decision ${decision.id}: ${result.reason}`);
        }
      }
    }
    
    console.log(`Adaptations Complete!`);
  }

  private classifyRisk(change: ProposedChange): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (change.action === 'SWITCH_PROMPT_VARIANT' || change.action === 'INVESTIGATE_STAGE') {
       return 'LOW'; // Safe to auto-apply assuming robust benchmarks
    }
    if (change.action === 'ADJUST_RETRY_POLICY' || change.action === 'ADJUST_TIMEOUT') {
       return 'MEDIUM'; // Canary candidate
    }
    return 'HIGH'; // Human approval
  }

  private getTargetKey(change: ProposedChange): string {
     switch (change.action) {
        case 'SWITCH_PROMPT_VARIANT':
           return `agent.${change.target.id}.activeVariant`;
        default:
           return `${change.target.type}.${change.target.id}.${change.action}`;
     }
  }

  private async recordAdaptation(
     decisionId: string,
     actionType: string,
     targetKey: string,
     status: string,
     previousState: any,
     newState: any,
     previousVersion: number | null,
     newVersion: number | null,
     fingerprint: string
  ) {
     return prisma.learningAdaptation.create({
        data: {
           decisionId,
           actionType,
           targetKey,
           status,
           previousState: previousState || {},
           newState: newState || {},
           previousVersion,
           newVersion,
           fingerprint
        }
     });
  }

  private hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }
}
