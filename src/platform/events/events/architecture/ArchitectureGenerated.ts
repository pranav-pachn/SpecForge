import { DomainEvent } from '../../DomainEvent';
export interface ArchitectureGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type ArchitectureGeneratedEvent = DomainEvent<ArchitectureGeneratedPayload>;