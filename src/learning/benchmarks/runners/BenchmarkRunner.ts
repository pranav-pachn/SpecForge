import { PairedObservation } from '../../models/LearningBenchmark';
import { SafetyEvaluator } from '../SafetyEvaluator';

export class BenchmarkRunner {
  private safety = new SafetyEvaluator();

  public async runBatch(
    inputs: Array<Record<string, unknown>>,
    candidateConfig: any,
    primaryMetric: string,
    mockImprovement: boolean = true,
    mockSafetyFailure: boolean = false
  ): Promise<{ observations: PairedObservation[]; aborted: boolean; abortReason?: string }> {
    
    const observations: PairedObservation[] = [];
    let aborted = false;
    let abortReason: string | undefined;

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];

      // Simulate control
      const control = {
        validationScore: 0.90,
        latencyMs: 1500,
        repairCount: 2.0,
        securityScore: 0.95,
        cost: 0.05,
        successRate: true
      };

      // Simulate candidate
      const candidate = {
        validationScore: mockImprovement ? 0.95 : 0.88,
        latencyMs: mockImprovement ? 1400 : 1600,
        repairCount: mockImprovement ? 1.0 : 2.5,
        securityScore: mockSafetyFailure ? 0.50 : 0.95, // trigger safety
        cost: 0.05,
        successRate: true
      };

      const obs: PairedObservation = {
        inputId: (input.id as string) || `test-${i}`,
        control: control as any,
        candidate: candidate as any
      };

      const safetyCheck = this.safety.checkCatastrophic(obs, primaryMetric);
      
      observations.push(obs);

      if (safetyCheck.aborted) {
         aborted = true;
         abortReason = safetyCheck.reason;
         break;
      }
    }

    return { observations, aborted, abortReason };
  }
}
