import { ExperimentMetrics } from '../../models/LearningExperiment';

export interface PromptExperimentRunnerInterface {
  runTargetedExperiment(
    agentId: string, 
    candidatePrompt: string, 
    datasetSize?: number
  ): Promise<{ control: ExperimentMetrics; candidate: ExperimentMetrics }>;
}

export interface WorkflowExperimentRunnerInterface {
  runShadowExperiment(
    candidateConfig: Record<string, unknown>,
    datasetSize?: number
  ): Promise<{ control: ExperimentMetrics; candidate: ExperimentMetrics }>;
}
