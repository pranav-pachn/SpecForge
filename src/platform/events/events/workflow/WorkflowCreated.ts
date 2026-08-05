import { DomainEvent } from '../../DomainEvent';
export interface WorkflowCreatedPayload { name: string; projectId: string; organizationId: string; }
export type WorkflowCreatedEvent = DomainEvent<WorkflowCreatedPayload>;