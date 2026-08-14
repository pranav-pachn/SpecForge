import { SimulationContext } from './SimulationContext';
import { Logger } from '../observability/Logger';

export class SimulationRuntime {
  private logger = new Logger('SimulationRuntime');

  async runSimulation(workflowId: string, repoPath: string): Promise<string> {
    this.logger.info(`[SimulationRuntime] Simulation models removed. Returning mock simulation ID.`);
    return `sim-mock-${Date.now()}`;
  }
}
