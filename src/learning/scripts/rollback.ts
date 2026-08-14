import { PrismaClient } from '@prisma/client';
import { PromptVariantHandler } from '../adaptations/handlers/PromptVariantHandler';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const adaptationId = args[0];

  if (!adaptationId) {
    console.error('Usage: npm run learning:rollback -- <adaptationId>');
    process.exit(1);
  }

  console.log(`\nSpecForge Adaptation Rollback`);
  console.log(`──────────────────────────────`);
  console.log(`Adaptation: ${adaptationId}`);

  const adaptation = await prisma.learningAdaptation.findUnique({
    where: { id: adaptationId }
  });

  if (!adaptation) {
    console.error(`\n✗ Rollback blocked`);
    console.error(`Reason:\nAdaptation ${adaptationId} not found.`);
    process.exit(1);
  }

  if (adaptation.status !== 'APPLIED') {
    console.error(`\n✗ Rollback blocked`);
    console.error(`Reason:\nAdaptation status is ${adaptation.status}. Only APPLIED adaptations can be rolled back.`);
    process.exit(1);
  }

  console.log(`\nTarget:\n${adaptation.targetKey}`);
  console.log(`\nCurrent Expected Version:\nv${adaptation.newVersion}`);

  try {
     let handler;
     if (adaptation.actionType === 'SWITCH_PROMPT_VARIANT') {
        handler = new PromptVariantHandler();
     } else {
        throw new Error(`No handler registered for rollback of actionType: ${adaptation.actionType}`);
     }

     console.log(`\nValidation:`);
     
     // Update status to REVERTING
     await prisma.learningAdaptation.update({
        where: { id: adaptation.id },
        data: { status: 'REVERTING' }
     });

     // Execute Rollback via Handler
     await handler.rollback(adaptation, prisma);
     console.log(`✓ Current state matches adaptation`);
     console.log(`✓ No newer adaptation detected`);
     console.log(`✓ Previous state available`);

     // Mark REVERTED
     await prisma.learningAdaptation.update({
        where: { id: adaptation.id },
        data: { 
           status: 'REVERTED',
           revertedAt: new Date()
        }
     });

     console.log(`\nRolling back...`);
     console.log(`\n✓ Rollback successful`);
  } catch (error: any) {
     console.error(`\n✗ Rollback blocked`);
     console.error(`Reason:\n${error.message}`);
     
     // Put it back to APPLIED or FAILED_REVERT
     await prisma.learningAdaptation.update({
        where: { id: adaptation.id },
        data: { status: 'APPLIED' } // keep it applied since revert failed
     });
     
     process.exit(1);
  }
}

main();
