import { PrismaClient } from '@prisma/client';
import { PromptRecommendationGenerator } from './generators/PromptRecommendationGenerator';
import { StageRecommendationGenerator } from './generators/StageRecommendationGenerator';

const prisma = new PrismaClient();

export class RecommendationEngine {
  async runRecommendations(): Promise<void> {
    const unresolvedPatterns = await prisma.learningPattern.findMany({
      where: {
        status: 'DETECTED'
      }
    });

    if (unresolvedPatterns.length === 0) {
      console.log('No unresolved patterns eligible for recommendations.');
      return;
    }

    console.log(`\n=== Running Recommendation Engine on ${unresolvedPatterns.length} Patterns ===`);

    const promptGenerator = new PromptRecommendationGenerator();
    const stageGenerator = new StageRecommendationGenerator();

    let newRecs = 0;
    let updatedRecs = 0;
    let skipped = 0;

    for (const pattern of unresolvedPatterns) {
      let recsToCreate = [];
      
      try {
        if (pattern.type.startsWith('PROMPT_')) {
          recsToCreate = await promptGenerator.generate(pattern);
        } else if (pattern.type.startsWith('STAGE_')) {
          recsToCreate = await stageGenerator.generate(pattern);
        } else {
          // Unhandled pattern types (e.g. REPAIR_LOOP could have a RepairGenerator in the future)
          skipped++;
          continue;
        }

        if (recsToCreate.length === 0) {
           skipped++;
        }

        for (const rec of recsToCreate) {
          const existing = await prisma.learningRecommendation.findUnique({
            where: { fingerprint: rec.fingerprint }
          });

          if (existing) {
            await prisma.learningRecommendation.update({
              where: { id: existing.id },
              data: {
                confidence: rec.confidence,
                status: 'PROPOSED', // Ensure it's proposed
                evidence: rec.evidence,
                updatedAt: new Date()
              }
            });
            updatedRecs++;
          } else {
            await prisma.learningRecommendation.create({
              data: {
                patternId: rec.patternId,
                type: rec.type,
                status: rec.status,
                proposedChange: rec.proposedChange as any,
                rationale: rec.rationale,
                expectedImpact: rec.expectedImpact,
                confidence: rec.confidence,
                evidence: rec.evidence,
                generator: rec.generator,
                generatorVersion: rec.generatorVersion,
                fingerprint: rec.fingerprint
              }
            });
            newRecs++;
          }
        }
        
        // Transition pattern to RECOMMENDED if we successfully generated recommendations
        if (recsToCreate.length > 0) {
          await prisma.learningPattern.update({
            where: { id: pattern.id },
            data: { status: 'RECOMMENDED' }
          });
        }
        
      } catch (err) {
        console.error(`Failed to generate recommendations for pattern ${pattern.id}:`, err);
        // Do NOT transition status if failure occurs
      }
    }

    console.log(`\nRecommendations Complete!`);
    console.log(`Patterns analyzed:        ${unresolvedPatterns.length}`);
    console.log(`Recommendations created:  ${newRecs}`);
    console.log(`Recommendations updated:  ${updatedRecs}`);
    console.log(`Skipped:                  ${skipped}`);
  }
}
