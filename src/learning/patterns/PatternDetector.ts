import { PrismaClient } from '@prisma/client';
import { StageBottleneckAnalyzer } from './StageBottleneckAnalyzer';
import { PromptDegradationAnalyzer } from './PromptDegradationAnalyzer';
import { RepairLoopAnalyzer } from './RepairLoopAnalyzer';

const prisma = new PrismaClient();

export class PatternDetector {
  async runDetection(): Promise<void> {
    const executions = await prisma.learningExecution.findMany({
      orderBy: { ingestedAt: 'asc' }
    });
    
    if (executions.length === 0) {
      console.log('No executions to analyze.');
      return;
    }
    
    console.log(`\n=== Running Pattern Detection on ${executions.length} Executions ===`);
    
    const analyzers = [
      new StageBottleneckAnalyzer(),
      new PromptDegradationAnalyzer(),
      new RepairLoopAnalyzer()
    ];

    let newPatterns = 0;
    let updatedPatterns = 0;

    for (const analyzer of analyzers) {
      const detectedPatterns = analyzer.analyze(executions);
      
      for (const pattern of detectedPatterns) {
        // Upsert pattern based on fingerprint
        const existing = await prisma.learningPattern.findUnique({
          where: { fingerprint: pattern.fingerprint }
        });

        if (existing) {
          await prisma.learningPattern.update({
            where: { id: existing.id },
            data: {
              severity: pattern.severity,
              confidence: pattern.confidence,
              description: pattern.description,
              evidence: pattern.evidence as any,
              lastDetectedAt: new Date(),
              status: "DETECTED" // Reset status if it was mitigated but re-detected
            }
          });
          updatedPatterns++;
        } else {
          await prisma.learningPattern.create({
            data: {
              fingerprint: pattern.fingerprint,
              type: pattern.type,
              severity: pattern.severity,
              confidence: pattern.confidence,
              description: pattern.description,
              evidence: pattern.evidence as any,
              detector: pattern.detector,
              detectorVersion: pattern.detectorVersion
            }
          });
          newPatterns++;
        }
      }
    }
    
    console.log(`\nDetection Complete!`);
    console.log(`New Patterns:      ${newPatterns}`);
    console.log(`Updated Patterns:  ${updatedPatterns}`);
  }
}
