import { db } from '@/platform/storage/db';
import { DriftEngine } from './src/intelligence/memory/DriftEngine';

async function main() {
  const memory = await db.engineeringMemory.findFirst();
  if (!memory) {
    console.log("No memory found");
    return;
  }
  
  console.log(`Evaluating impact for memory: ${memory.id} - ${memory.title}`);
  
  await DriftEngine.evaluateImpact(memory.workflowId, memory.id, memory.sourceVersionId);
  
  console.log("Done evaluating drift.");
}

main().catch(console.error).finally(() => process.exit(0));
