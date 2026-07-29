import { db } from "../db";

export class Timeline {
  /**
   * Fetches the Engineering Memory timeline for a workflow.
   */
  static async getWorkflowTimeline(workflowId: string, typeFilter?: string) {
    const where: any = { workflowId };
    if (typeFilter) {
      where.memoryType = typeFilter;
    }

    const memories = await db.engineeringMemory.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return memories;
  }
}
