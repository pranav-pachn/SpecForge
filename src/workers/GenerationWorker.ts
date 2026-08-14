import { BaseWorker } from './base/BaseWorker';
import { QueueNames } from '../platform/queue/QueueManager';
import { JobType } from '../platform/queue/interfaces/RuntimeJob';
import { WorkerRegistry } from '../platform/queue/WorkerRegistry';

export class GenerationWorker extends BaseWorker {
  constructor(workerId: string) {
    super(QueueNames.AI, workerId);
    
    // Register capabilities
    WorkerRegistry.getInstance().register(workerId, [JobType.AGENT]);
  }
}
