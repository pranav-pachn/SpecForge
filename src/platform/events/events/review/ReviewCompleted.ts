import { DomainEvent } from '../../DomainEvent';
export interface ReviewCompletedPayload { reviewId: string; overallScore: number; }
export type ReviewCompletedEvent = DomainEvent<ReviewCompletedPayload>;