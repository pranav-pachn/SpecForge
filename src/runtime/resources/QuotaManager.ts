import { db as prisma } from '@/platform/storage/db';

export class QuotaExceededError extends Error {
  constructor(message = 'Resource quota exceeded.') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class QuotaManager {
  /**
   * Checks if the organization has enough quota to run the given agent.
   */
  static async checkQuota(organizationId: string, agentId: string): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await prisma.usageRecord.findUnique({
      where: {
        organizationId_metric_periodStart: {
          organizationId,
          metric: 'ai_tokens_used',
          periodStart
        }
      }
    });

    const MAX_TOKENS = 100000; // Simplified for now, typically from EntitlementRegistry
    
    if (usage && usage.count >= MAX_TOKENS) {
      throw new QuotaExceededError('Monthly AI token quota exceeded.');
    }
  }
}
