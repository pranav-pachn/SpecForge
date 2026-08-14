import { Lesson } from './LessonExtractor';

export class PatternDetector {
  async detectPatterns(newLessons: Lesson[]): Promise<any[]> {
    console.log(`[PatternDetector] LearningPattern models removed. Skipping detection.`);
    return [];
  }
}
