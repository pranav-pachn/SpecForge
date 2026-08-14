import { RecommendationEngine } from '../recommendations/RecommendationEngine';

async function main() {
  console.log('💡 Starting Continuous Learning Recommendation Engine...\n');
  
  const engine = new RecommendationEngine();
  await engine.runRecommendations();
}

main().catch(err => {
  console.error('Recommendation generation failed:', err);
  process.exit(1);
});
