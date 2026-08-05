import { db as prisma } from '@/platform/storage/db';

export interface LoadedCheckpoint {
  completedAgents: string[];
  artifacts: any;
}

export class CheckpointLoader {
  /**
   * Loads the latest checkpoint for a workflow, if any.
   */
  static async loadLatest(workflowId: string): Promise<LoadedCheckpoint | null> {
    const latest = await prisma.agentCheckpoint.findFirst({
      where: { workflowId },
      orderBy: { snapshotAt: 'desc' }
    });

    if (!latest) return null;

    if (latest.version !== 1) {
      console.warn(`[CheckpointLoader] Checkpoint version ${latest.version} is incompatible with current runtime. Ignoring checkpoint.`);
      return null;
    }

    const snapshotData = latest.artifacts as any;
    
    return {
      completedAgents: latest.completedAgents,
      artifacts: snapshotData?.artifacts || {}
    };
  }
}
