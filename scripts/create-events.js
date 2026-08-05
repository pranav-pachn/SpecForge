const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/platform/events/events');

const events = {
  'workflow/WorkflowCreated.ts': `import { DomainEvent } from '../../DomainEvent';
export interface WorkflowCreatedPayload { name: string; projectId: string; organizationId: string; }
export type WorkflowCreatedEvent = DomainEvent<WorkflowCreatedPayload>;`,
  
  'workflow/WorkflowCompleted.ts': `import { DomainEvent } from '../../DomainEvent';
export interface WorkflowCompletedPayload { status: string; }
export type WorkflowCompletedEvent = DomainEvent<WorkflowCompletedPayload>;`,

  'specification/SpecificationCreated.ts': `import { DomainEvent } from '../../DomainEvent';
export interface SpecificationCreatedPayload { artifactId: string; versionId: string; content: string; }
export type SpecificationCreatedEvent = DomainEvent<SpecificationCreatedPayload>;`,

  'specification/SpecificationApproved.ts': `import { DomainEvent } from '../../DomainEvent';
export interface SpecificationApprovedPayload { artifactId: string; versionId: string; }
export type SpecificationApprovedEvent = DomainEvent<SpecificationApprovedPayload>;`,

  'architecture/ArchitectureGenerated.ts': `import { DomainEvent } from '../../DomainEvent';
export interface ArchitectureGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type ArchitectureGeneratedEvent = DomainEvent<ArchitectureGeneratedPayload>;`,

  'task/TasksGenerated.ts': `import { DomainEvent } from '../../DomainEvent';
export interface TasksGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type TasksGeneratedEvent = DomainEvent<TasksGeneratedPayload>;`,

  'execution/ExecutionPackGenerated.ts': `import { DomainEvent } from '../../DomainEvent';
export interface ExecutionPackGeneratedPayload { artifactId: string; versionId: string; content: string; }
export type ExecutionPackGeneratedEvent = DomainEvent<ExecutionPackGeneratedPayload>;`,

  'review/ReviewCompleted.ts': `import { DomainEvent } from '../../DomainEvent';
export interface ReviewCompletedPayload { reviewId: string; overallScore: number; }
export type ReviewCompletedEvent = DomainEvent<ReviewCompletedPayload>;`,

  'validation/ValidationCompleted.ts': `import { DomainEvent } from '../../DomainEvent';
export interface ValidationCompletedPayload { reportId: string; issuesCount: number; }
export type ValidationCompletedEvent = DomainEvent<ValidationCompletedPayload>;`,

  'drift/DriftDetected.ts': `import { DomainEvent } from '../../DomainEvent';
export interface DriftDetectedPayload { eventId: string; driftScore: number; }
export type DriftDetectedEvent = DomainEvent<DriftDetectedPayload>;`
};

for (const [file, content] of Object.entries(events)) {
  const filePath = path.join(srcDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Events created.');
