import { JobType } from './interfaces/RuntimeJob';

export interface WorkerHeartbeat {
  workerId: string;
  types: JobType[];
  lastSeen: Date;
  activeJobs: number;
  avgDuration: number;
}

export class WorkerRegistry {
  private static instance: WorkerRegistry;
  private workers: Map<string, WorkerHeartbeat> = new Map();

  private constructor() {}

  public static getInstance(): WorkerRegistry {
    if (!WorkerRegistry.instance) {
      WorkerRegistry.instance = new WorkerRegistry();
    }
    return WorkerRegistry.instance;
  }

  public register(workerId: string, types: JobType[]): void {
    this.workers.set(workerId, {
      workerId,
      types,
      lastSeen: new Date(),
      activeJobs: 0,
      avgDuration: 0
    });
  }

  public heartbeat(workerId: string, metrics: { activeJobs: number; avgDuration: number }): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.lastSeen = new Date();
      worker.activeJobs = metrics.activeJobs;
      worker.avgDuration = metrics.avgDuration;
    }
  }

  public getActiveWorkers(): WorkerHeartbeat[] {
    const now = Date.now();
    const active: WorkerHeartbeat[] = [];
    
    for (const worker of Array.from(this.workers.values())) {
      // Consider dead if no heartbeat for 60 seconds
      if (now - worker.lastSeen.getTime() < 60000) {
        active.push(worker);
      }
    }
    
    return active;
  }
}
