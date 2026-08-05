import { DomainEvent } from '../../DomainEvent';
export interface DriftDetectedPayload { eventId: string; driftScore: number; }
export type DriftDetectedEvent = DomainEvent<DriftDetectedPayload>;