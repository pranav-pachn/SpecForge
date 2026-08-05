import { DomainEventType } from '../DomainEventType';
import { DomainEvent } from '../DomainEvent';
import { SpecificationCreatedPayload, SpecificationCreatedEvent } from '../events/specification/SpecificationCreated';
import { ArchitectureGeneratedPayload, ArchitectureGeneratedEvent } from '../events/architecture/ArchitectureGenerated';
import { TasksGeneratedPayload, TasksGeneratedEvent } from '../events/task/TasksGenerated';
import { ReviewCompletedPayload, ReviewCompletedEvent } from '../events/review/ReviewCompleted';
import { ValidationCompletedPayload, ValidationCompletedEvent } from '../events/validation/ValidationCompleted';
import { WorkflowCreatedPayload, WorkflowCreatedEvent } from '../events/workflow/WorkflowCreated';
import { WorkflowCompletedPayload, WorkflowCompletedEvent } from '../events/workflow/WorkflowCompleted';

export interface EventContext {
  workflowId?: string;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  source?: string;
  version?: number;
}

export class EventFactory {
  private static base<T>(type: DomainEventType, payload: T, context: EventContext): DomainEvent<T> {
    return {
      id: crypto.randomUUID(),
      type,
      occurredAt: new Date(),
      version: context.version ?? 1,
      workflowId: context.workflowId,
      userId: context.userId,
      correlationId: context.correlationId || crypto.randomUUID(),
      causationId: context.causationId, 
      source: context.source || "system",
      payload
    };
  }

  static specificationCreated(payload: SpecificationCreatedPayload, ctx: EventContext): SpecificationCreatedEvent {
    return this.base("SpecificationCreated", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static architectureGenerated(payload: ArchitectureGeneratedPayload, ctx: EventContext): ArchitectureGeneratedEvent {
    return this.base("ArchitectureGenerated", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static tasksGenerated(payload: TasksGeneratedPayload, ctx: EventContext): TasksGeneratedEvent {
    return this.base("TasksGenerated", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static reviewCompleted(payload: ReviewCompletedPayload, ctx: EventContext): ReviewCompletedEvent {
    return this.base("ReviewCompleted", payload, { ...ctx, source: "WorkflowEngine" });
  }
  
  static validationCompleted(payload: ValidationCompletedPayload, ctx: EventContext): ValidationCompletedEvent {
    return this.base("ValidationCompleted", payload, { ...ctx, source: "WorkflowEngine" });
  }
  
  static workflowStarted(payload: WorkflowCreatedPayload, ctx: EventContext): WorkflowCreatedEvent {
    return this.base("WorkflowStarted", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static workflowCreated(payload: WorkflowCreatedPayload, ctx: EventContext): WorkflowCreatedEvent {
    return this.base("WorkflowCreated", payload, { ...ctx, source: "WorkflowApplicationService" });
  }

  static workflowCompleted(payload: WorkflowCompletedPayload, ctx: EventContext): WorkflowCompletedEvent {
    return this.base("WorkflowCompleted", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static workflowFailed(payload: any, ctx: EventContext): DomainEvent<any> {
    return this.base("WorkflowFailed", payload, { ...ctx, source: "WorkflowEngine" });
  }

  static approvalRequested(payload: any, ctx: EventContext): DomainEvent<any> {
    return this.base("ApprovalRequested", payload, { ...ctx, source: "ApprovalEngine" });
  }

  static resourceUtilized(payload: { tokensUsed: number, agentId?: string }, ctx: EventContext): DomainEvent<any> {
    return this.base("ResourceUtilized", payload, { ...ctx, source: "AgentRuntime" });
  }
}

