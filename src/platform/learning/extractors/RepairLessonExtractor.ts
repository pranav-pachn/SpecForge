import { LessonExtractor, Lesson } from './LessonExtractor';

export class RepairLessonExtractor implements LessonExtractor {
  async extract(workflowId: string): Promise<Lesson[]> {
    console.log(`[RepairLessonExtractor] MemoryNode models removed. Skipping extraction.`);
    return [];
  }
}
