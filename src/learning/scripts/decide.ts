import { DecisionEngine } from '../decisions/DecisionEngine';

async function main() {
  console.log('⚖️ Starting Continuous Learning Decision Engine...\n');
  
  const engine = new DecisionEngine();
  await engine.runDecisions('AUTO_ACCEPT_V1');
}

main().catch(err => {
  console.error('Decision engine failed:', err);
  process.exit(1);
});
