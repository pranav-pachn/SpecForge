import { LearningDataPipeline } from '../ingestion/LearningDataPipeline';
import { PatternDetector } from '../patterns/PatternDetector';

async function main() {
  console.log('🚀 Starting Continuous Learning Data Ingestion...\n');
  
  const pipeline = new LearningDataPipeline();
  await pipeline.ingestExecutions();
  
  const detector = new PatternDetector();
  await detector.runDetection();
}

main().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
