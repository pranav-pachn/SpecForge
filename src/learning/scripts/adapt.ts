import { AdaptationEngine } from '../adaptations/AdaptationEngine';

async function main() {
  console.log('🔄 Starting Adaptation Engine...\n');
  const engine = new AdaptationEngine();
  await engine.runAdaptations();
}

main().catch(err => {
  console.error('Adaptation engine failed:', err);
  process.exit(1);
});
