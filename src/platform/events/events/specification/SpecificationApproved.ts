import { DomainEvent } from '../../DomainEvent';
export interface SpecificationApprovedPayload { artifactId: string; versionId: string; }
export type SpecificationApprovedEvent = DomainEvent<SpecificationApprovedPayload>;