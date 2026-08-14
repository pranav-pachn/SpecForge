export interface Lesson {
  type: string;
  workflowId: string;
  source: string; // which extractor generated this
  evidence: any;
  timestamp: Date;
}

export interface LessonExtractor {
  /**
   * Extracts raw observations/lessons from a completed workflow
   */
  extract(workflowId: string): Promise<Lesson[]>;
}
