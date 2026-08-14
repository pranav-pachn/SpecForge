import { LearningAdaptation, PrismaClient } from '@prisma/client';
import { ProposedChange } from '../../models/LearningRecommendation';
import { AdaptationHandler, AdaptationResult, ValidationResult } from './AdaptationHandler';

export class PromptVariantHandler implements AdaptationHandler {
  canHandle(action: ProposedChange): boolean {
    return action.action === 'SWITCH_PROMPT_VARIANT';
  }

  async validate(action: ProposedChange, prisma: PrismaClient): Promise<ValidationResult> {
    if (!action.candidate?.variantId) {
      return { valid: false, reason: 'Candidate variantId is missing' };
    }

    if (!action.target.id) {
       return { valid: false, reason: 'Target agent id is missing' };
    }

    const variantId = action.candidate.variantId;
    const variant = await prisma.promptVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant) {
      return { valid: false, reason: `PromptVariant not found in registry: ${variantId}` };
    }

    const targetKey = `agent.${action.target.id}.activeVariant`;
    const currentConfig = await prisma.systemConfig.findUnique({
      where: { key: targetKey }
    });

    return {
      valid: true,
      previousState: currentConfig?.value || { variantId: 'default' },
      newState: { variantId }
    };
  }

  async apply(action: ProposedChange, prisma: PrismaClient): Promise<AdaptationResult> {
    const targetKey = `agent.${action.target.id}.activeVariant`;
    const variantId = action.candidate?.variantId;

    if (!variantId) {
       return { success: false, reason: 'Missing variantId in apply phase' };
    }

    // Get current version for optimistic concurrency
    const current = await prisma.systemConfig.findUnique({
      where: { key: targetKey }
    });
    
    const previousVersion = current?.version || 0;
    const newVersion = previousVersion + 1;

    try {
      await prisma.systemConfig.upsert({
        where: { key: targetKey },
        update: {
          value: { variantId },
          version: newVersion
        },
        create: {
          key: targetKey,
          value: { variantId },
          version: newVersion
        }
      });
      return { success: true, previousVersion, newVersion };
    } catch (e: any) {
      return { success: false, reason: e.message };
    }
  }

  async rollback(adaptation: LearningAdaptation, prisma: PrismaClient): Promise<void> {
    if (adaptation.actionType !== 'SWITCH_PROMPT_VARIANT') {
      throw new Error(`Invalid handler for action type ${adaptation.actionType}`);
    }

    const targetKey = adaptation.targetKey;
    const current = await prisma.systemConfig.findUnique({
      where: { key: targetKey }
    });

    if (!current) {
      throw new Error('Cannot rollback: target configuration does not exist.');
    }

    // Check version
    if (current.version !== adaptation.newVersion) {
      throw new Error(`Rollback blocked: Configuration has changed since adaptation. Expected v${adaptation.newVersion}, got v${current.version}.`);
    }

    // Check state (just to be extra safe)
    const currentStateStr = JSON.stringify(current.value);
    const adaptationStateStr = JSON.stringify(adaptation.newState);
    
    if (currentStateStr !== adaptationStateStr) {
      throw new Error('Rollback blocked: Actual current state does not match expected state.');
    }

    const previousVersion = adaptation.previousVersion || 0;
    
    await prisma.systemConfig.update({
      where: { key: targetKey },
      data: {
        value: adaptation.previousState as any,
        version: previousVersion
      }
    });
  }
}
