import { db } from "@/platform/storage/db";
import { MetricProvider } from "./MetricProvider";
import { ApprovalStatus } from "@prisma/client";

export class ApprovalHealthProvider implements MetricProvider {
  async calculate(orgId: string, teamId?: string | null): Promise<number | null> {
    const whereClause: any = { 
      chain: {
        workflow: { organizationId: orgId }
      }
    };
    if (teamId) whereClause.chain.workflow.teamId = teamId;

    const requests = await db.approvalRequest.findMany({
      where: whereClause,
      select: { status: true },
      take: 200,
      orderBy: { createdAt: "desc" }
    });

    if (requests.length === 0) return null;

    const healthy = requests.filter(r => r.status === ApprovalStatus.APPROVED).length;
    return Math.round((healthy / requests.length) * 100);
  }
}
