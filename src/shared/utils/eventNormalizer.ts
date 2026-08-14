import { AgentEvent, AgentStatus, StageState, WorkflowStage } from "../types/agent-events";

// Raw event from the EventBus
export interface StoredEvent {
  id: string;
  type: string;
  source: string;
  occurredAt: string;
  workflowId?: string;
  sequence?: number;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  status: string;
  payload: any;
}

export interface OrchestrationState {
  stages: StageState[];
  currentStageIndex: number;
}

const STAGES: WorkflowStage[] = [
  'SPECIFICATION',
  'PLANNING',
  'TASKS',
  'EXECUTION',
  'REVIEW',
  'VALIDATION'
];

export function normalizeEvents(events: StoredEvent[]): {
  orchestration: OrchestrationState;
  agents: AgentEvent[];
} {
  // 1. Initialize stages
  const stages: StageState[] = STAGES.map(s => ({ stage: s, status: 'WAITING' }));
  
  // 2. Initialize agents
  const agentMap = new Map<string, AgentEvent>([
    ['Clarifier', { agentName: 'Clarifier', status: 'WAITING' }],
    ['Planner', { agentName: 'Planner', status: 'WAITING' }],
    ['Task Worker', { agentName: 'Task Worker', status: 'WAITING' }],
    ['Execution Worker', { agentName: 'Execution Worker', status: 'WAITING' }],
    ['Evaluator', { agentName: 'Evaluator', status: 'WAITING' }]
  ]);

  let currentStageIndex = 0;

  // 3. Process events chronologically
  // We assume events are sorted by occurredAt (oldest first) or we process them backwards?
  // Let's assume they are returned oldest first.
  const sortedEvents = [...events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  for (const event of sortedEvents) {
    // Stage logic
    if (event.type === 'SpecificationCreated') {
      stages[0].status = 'COMPLETED';
      agentMap.get('Clarifier')!.status = 'COMPLETED';
      currentStageIndex = 1;
    } else if (event.type === 'ArchitectureGenerated') {
      stages[1].status = 'COMPLETED';
      agentMap.get('Planner')!.status = 'COMPLETED';
      currentStageIndex = 2;
    } else if (event.type === 'TasksGenerated') {
      stages[2].status = 'COMPLETED';
      agentMap.get('Task Worker')!.status = 'COMPLETED';
      currentStageIndex = 3;
    } else if (event.type === 'WorkflowCreated' || event.type === 'WorkflowStatusChanged') {
      const status = event.payload?.status || event.payload?.newStatus;
      
      // Update running agent based on status
      if (status === 'CLARIFYING') {
        stages[0].status = 'RUNNING';
        agentMap.get('Clarifier')!.status = 'RUNNING';
        agentMap.get('Clarifier')!.currentAction = 'Analyzing requirements...';
        currentStageIndex = 0;
      }
      else if (status === 'PLANNING' || status === 'WAITING_FOR_APPROVAL') {
        stages[1].status = 'RUNNING';
        agentMap.get('Planner')!.status = 'RUNNING';
        agentMap.get('Planner')!.currentAction = 'Generating architecture plan...';
        currentStageIndex = 1;
      }
      else if (status === 'TASK_BREAKDOWN') {
        stages[2].status = 'RUNNING';
        agentMap.get('Task Worker')!.status = 'RUNNING';
        agentMap.get('Task Worker')!.currentAction = 'Generating tasks...';
        currentStageIndex = 2;
      }
      else if (status === 'EXECUTING') {
        stages[3].status = 'RUNNING';
        agentMap.get('Execution Worker')!.status = 'RUNNING';
        agentMap.get('Execution Worker')!.currentAction = 'Executing tasks...';
        currentStageIndex = 3;
      }
      else if (status === 'REVIEWING' || status === 'ENGINEERING_REVIEW') {
        stages[3].status = 'COMPLETED';
        agentMap.get('Execution Worker')!.status = 'COMPLETED';
        stages[4].status = 'RUNNING';
        agentMap.get('Evaluator')!.status = 'RUNNING';
        agentMap.get('Evaluator')!.currentAction = 'Evaluating code changes...';
        currentStageIndex = 4;
      }
      else if (status === 'VALIDATING' || status === 'COMPLETED') {
        stages[4].status = 'COMPLETED';
        agentMap.get('Evaluator')!.status = 'COMPLETED';
        stages[5].status = 'COMPLETED';
        currentStageIndex = 5;
      }
    }
  }

  // Any stages before the current index that are WAITING should be considered COMPLETED
  // (In case some events were missed or skipped)
  for (let i = 0; i < currentStageIndex; i++) {
    if (stages[i].status === 'WAITING') {
      stages[i].status = 'COMPLETED';
    }
  }

  return {
    orchestration: {
      stages,
      currentStageIndex
    },
    agents: Array.from(agentMap.values())
  };
}
