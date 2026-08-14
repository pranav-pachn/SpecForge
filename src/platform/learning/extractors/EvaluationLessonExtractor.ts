import { LessonExtractor, Lesson } from './LessonExtractor';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EvaluationLessonExtractor implements LessonExtractor {
  
  async extract(workflowId: string): Promise<Lesson[]> {
    // 1. Fetch evaluations for this workflow
    const evaluations = await prisma.engineeringReview.findMany({
      where: { workflowId }
    });

    const lessons: Lesson[] = [];

    // 2. Identify potential issues (e.g. low scores)
    for (const evalResult of evaluations) {
      if (evalResult.securityScore < 70) {
        lessons.push({
          type: 'SECURITY_DEFICIENCY',
          workflowId,
          source: 'EvaluationLessonExtractor',
          evidence: {
            reviewId: evalResult.id,
            score: evalResult.securityScore
          },
          timestamp: new Date()
        });
      }
    }

    return lessons;
  }
}
