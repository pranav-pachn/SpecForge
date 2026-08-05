import { DomainEvent } from '../../DomainEvent';
export interface SpecificationCreatedPayload { artifactId: string; versionId: string; content: string; }
export type SpecificationCreatedEvent = DomainEvent<SpecificationCreatedPayload>;