import { db as prisma } from '@/platform/storage/db';
import { ExecutionSnapshot } from './ExecutionSnapshot';

export class CheckpointWriter {
  /**
   * Saves a checkpoint of the current execution state.
   */
  static async save(
    snapshot: ExecutionSnapshot
  ): Promise<void> {
    const snapshotData = {
      artifacts: snapshot.artifacts,
      // Future: variables, memory references
    };

    // We can either create new rows for a full history, or upsert the latest.
    // For now, we'll create new rows so we have a full history of checkpoints.
    await prisma.agentCheckpoint.create({
      data: {
        workflowId: snapshot.workflowId,
        completedAgents: snapshot.completedAgents,
        version: snapshot.snapshotVersion,
        artifacts: snapshotData
      }
    });
  }
}
