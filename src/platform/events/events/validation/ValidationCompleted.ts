import { DomainEvent } from '../../DomainEvent';
export interface ValidationCompletedPayload { reportId: string; issuesCount: number; }
export type ValidationCompletedEvent = DomainEvent<ValidationCompletedPayload>;