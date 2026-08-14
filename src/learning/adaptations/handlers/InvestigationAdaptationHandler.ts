import { PrismaClient, LearningAdaptation } from '@prisma/client';
import { ProposedChange } from '../../models/LearningRecommendation';
import { AdaptationHandler, AdaptationResult, ValidationResult } from './AdaptationHandler';

export class InvestigationAdaptationHandler implements AdaptationHandler {
  canHandle(action: ProposedChange): boolean {
    return action.action === 'INVESTIGATE_STAGE';
  }

  async validate(action: ProposedChange, prisma: PrismaClient): Promise<ValidationResult> {
    return {
      valid: true,
      previousState: { investigationState: 'PENDING' },
      newState: { investigationState: 'OPEN' }
    };
  }

  async apply(action: ProposedChange, prisma: PrismaClient): Promise<AdaptationResult> {
    return { success: true, previousVersion: 0, newVersion: 1 };
  }

  async rollback(adaptation: LearningAdaptation, prisma: PrismaClient): Promise<void> {
    // Nothing to do
  }
}
