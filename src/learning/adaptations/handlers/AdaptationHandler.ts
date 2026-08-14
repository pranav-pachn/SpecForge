import { LearningAdaptation, PrismaClient } from '@prisma/client';
import { ProposedChange } from '../../models/LearningRecommendation';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  previousState?: any;
  newState?: any;
}

export interface AdaptationResult {
  success: boolean;
  reason?: string;
  previousVersion?: number;
  newVersion?: number;
}

export interface AdaptationHandler {
  canHandle(action: ProposedChange): boolean;
  validate(action: ProposedChange, prisma: PrismaClient): Promise<ValidationResult>;
  apply(action: ProposedChange, prisma: PrismaClient): Promise<AdaptationResult>;
  rollback(adaptation: LearningAdaptation, prisma: PrismaClient): Promise<void>;
}
