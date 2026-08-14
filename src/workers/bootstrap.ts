import { GenerationWorker } from './GenerationWorker';

import '../platform/queue/executors'; // Initialize executors

async function bootstrap() {
  console.log('[Worker Bootstrap] Starting Distributed Execution Workers...');
  
  // Start the Generation Worker (which handles AGENT jobs)
  new GenerationWorker('worker-gen-01');
  
  // Future: new EvaluationWorker('worker-eval-01');
  // Future: new IndexingWorker('worker-idx-01');
  // Future: new MemoryWorker('worker-mem-01');
  // Future: new MCPWorker('worker-mcp-01');
  // Future: new GraphWorker('worker-graph-01');
  
  console.log('[Worker Bootstrap] Workers started successfully.');
  
}

bootstrap().catch(console.error);
