import { BenchmarkEngine } from '../benchmarks/BenchmarkEngine';

async function main() {
  console.log('🧪 Starting Continuous Learning Benchmark Engine...\n');
  
  const engine = new BenchmarkEngine();
  await engine.runBenchmarks();
}

main().catch(err => {
  console.error('Benchmark engine failed:', err);
  process.exit(1);
});
