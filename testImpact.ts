import { db } from "./src/lib/db";
import { ImpactAnalyzer } from "./src/lib/memory/ImpactAnalyzer";

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
