export type PipelineStage = 'SPEC' | 'CLARIFY' | 'PLAN' | 'EXECUTE' | 'ENG_REVIEW' | 'REVIEW' | 'VALIDATE' | 'DRIFT';
export type PipelineStatus = 'DONE' | 'RUNNING' | 'PENDING' | 'STALE' | 'FAILED' | 'BLOCKED';

export interface StageInfo {
  id: PipelineStage;
  label: string;
  status: PipelineStatus;
}

export function getWorkflowPipeline(workflow: any): StageInfo[] {
  const artifacts = workflow.artifacts || [];
  const status = workflow.status;

  const STAGES: { id: PipelineStage; label: string; artifacts: string[] }[] = [
    { id: 'SPEC', label: 'Spec', artifacts: ['SPEC'] },
    { id: 'CLARIFY', label: 'Clarify', artifacts: ['CLARIFICATION'] },
    { id: 'PLAN', label: 'Plan', artifacts: ['PLAN', 'ARCHITECTURE', 'TASKS'] },
    { id: 'EXECUTE', label: 'Execute', artifacts: ['CODE', 'EXECUTION_PACK'] },
    { id: 'ENG_REVIEW', label: 'Eng Review', artifacts: [] },
    { id: 'REVIEW', label: 'Review', artifacts: ['REVIEW_REPORT'] },
    { id: 'VALIDATE', label: 'Validate', artifacts: ['VALIDATION_REPORT'] },
    { id: 'DRIFT', label: 'Drift', artifacts: [] }
  ];

  const getActiveStageIndex = (): number => {
    switch (status) {
      case 'DRAFT':
      case 'SPEC_REVIEW': return 0;
      case 'CLARIFYING': return 1;
      case 'PLANNING':
      case 'WAITING_FOR_APPROVAL': 
      case 'TASK_BREAKDOWN': 
      case 'READY_FOR_EXECUTION': return 2;
      case 'EXECUTING': return 3;
      case 'ENGINEERING_REVIEW': return 4;
      case 'REVIEWING': return 5;
      case 'VALIDATING': return 6;
      case 'COMPLETED':
      case 'ARCHIVED': return 6;
      default: return 0;
    }
  };

  const activeIndex = getActiveStageIndex();
  let blockFound = false;

  return STAGES.map((stage, index) => {
    let hasStale = false;
    let hasFailed = false;

    const relevantArtifacts = artifacts.filter((a: any) => stage.artifacts.includes(a.type));
    hasStale = relevantArtifacts.some((a: any) => a.versions?.[0]?.status === 'STALE');
    hasFailed = relevantArtifacts.some((a: any) => a.versions?.[0]?.status === 'REJECTED' || a.versions?.[0]?.status === 'FAILED');

    if (stage.id === 'EXECUTE') {
      const tasks = workflow.tasks || [];
      if (tasks.length > 0 && tasks.some((t: any) => t.status === 'FAILED')) hasFailed = true;
    }

    let stageStatus: PipelineStatus = 'PENDING';

    if (hasFailed) {
      stageStatus = 'FAILED';
      blockFound = true;
    }
    else if (hasStale) {
      stageStatus = 'STALE';
      blockFound = true;
    }
    else if (index < activeIndex) {
      stageStatus = 'DONE';
    }
    else if (index === activeIndex) {
      stageStatus = blockFound ? 'BLOCKED' : 'RUNNING';
    } else {
      stageStatus = 'PENDING'; // Future stages are pending (locked)
    }

    return {
      id: stage.id,
      label: stage.label,
      status: stageStatus
    };
  });
}
