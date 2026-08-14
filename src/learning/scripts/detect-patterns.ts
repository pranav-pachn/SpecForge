import { PatternDetector } from '../patterns/PatternDetector';

async function main() {
  console.log('🔍 Starting Continuous Learning Pattern Detection...\n');
  
  const detector = new PatternDetector();
  await detector.runDetection();
}

main().catch(err => {
  console.error('Detection failed:', err);
  process.exit(1);
});
