import { DomainEvent } from '../../DomainEvent';
export interface TasksGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type TasksGeneratedEvent = DomainEvent<TasksGeneratedPayload>;