import { ExperimentEngine } from '../experiments/ExperimentEngine';

async function main() {
  console.log('🧪 Starting Continuous Learning Experiment Engine...\n');
  
  const engine = new ExperimentEngine();
  await engine.runExperiments();
}

main().catch(err => {
  console.error('Experiment engine failed:', err);
  process.exit(1);
});
