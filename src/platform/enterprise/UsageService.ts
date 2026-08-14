export class UsageService {
  async recordUsage(params: {
    organizationId: string;
    projectId?: string;
    workflowId?: string;
    type: 'TOKENS' | 'STORAGE' | 'SIMULATION' | 'EXECUTION';
    provider?: string;
    metricValue: number;
    costUsd: number;
  }) {
    console.log(`[UsageService] UsageRecord models removed. Skipping recordUsage.`);
    return null;
  }

  async getMonthlyUsage(organizationId: string, month: Date) {
    console.log(`[UsageService] UsageRecord models removed. Returning mock monthly usage.`);
    return { totalCost: 0, byType: {} as Record<string, number> };
  }
}
