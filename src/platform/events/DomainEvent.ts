import { DomainEventType } from './DomainEventType';

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  occurredAt: Date;
  version: number;
  workflowId?: string;
  sequence?: number;
  userId?: string;
  correlationId?: string;
  causationId?: string;
  source: string;
  status?: string;
  payload: T;
}

