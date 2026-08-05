import { DomainEvent } from '../../DomainEvent';
export interface WorkflowCompletedPayload { status: string; }
export type WorkflowCompletedEvent = DomainEvent<WorkflowCompletedPayload>;