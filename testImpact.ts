import { db } from '@/platform/storage/db';
import { ImpactAnalyzer } from './src/intelligence/memory/ImpactAnalyzer';

async function main() {
  const memory = await db.engineeringMemory.findFirst();
  if (!memory) {
    console.log("No memory found");
    return;
  }
  
  console.log(`Found memory: ${memory.id} - ${memory.title}`);
  
  const impact = await ImpactAnalyzer.analyze(memory.id, memory.severity);
  
  console.log("Impact Analysis:");
  console.log(JSON.stringify(impact, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
