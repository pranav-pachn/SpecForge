import { DomainEvent } from '../../DomainEvent';
export interface ExecutionPackGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type ExecutionPackGeneratedEvent = DomainEvent<ExecutionPackGeneratedPayload>;