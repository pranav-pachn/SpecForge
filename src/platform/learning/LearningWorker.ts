import { Worker, Job } from 'bullmq';
import { Logger } from '../../platform/observability/Logger';
import { LearningOrchestrator } from './LearningOrchestrator';

export class LearningWorker {
  private logger = new Logger('LearningWorker');
  private worker: Worker;

  constructor(
    private orchestrator: LearningOrchestrator,
    redisConnection: any
  ) {
    this.worker = new Worker('learning-jobs', async (job: Job) => {
      this.logger.info(`Processing learning job for workflow ${job.data.workflowId}`);
      
      try {
        await this.orchestrator.processWorkflow(job.data.workflowId, job.data.projectId);
        this.logger.info(`Learning job completed for workflow ${job.data.workflowId}`);
      } catch (error: any) {
        this.logger.error(`Failed to process learning job: ${error.message}`);
        throw error;
      }
    }, { connection: redisConnection });
    
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed after attempts: ${err.message}`);
    });
  }

  async close() {
    await this.worker.close();
  }
}
