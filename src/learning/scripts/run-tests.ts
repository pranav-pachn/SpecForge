import { readdirSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';

async function runTests() {
  const testsDir = join(__dirname, '../../../tests/learning');
  const files = readdirSync(testsDir).filter(f => f.endsWith('.test.ts'));
  
  let passed = 0;
  let failed = 0;
  
  // Minimal test runner stub for describe/it
  (global as any).describe = (name: string, fn: Function) => {
    console.log(`\nRunning suite: ${name}`);
    fn();
  };
  
  (global as any).it = async (name: string, fn: Function) => {
    try {
      await fn();
      passed++;
    } catch (err: any) {
      console.error(`❌ Test failed: ${name}`);
      console.error(err.message);
      failed++;
    }
  };

  for (const file of files) {
    const fullPath = join(testsDir, file);
    await import(pathToFileURL(fullPath).toString());
  }

  // Allow asynchronous tests to finish (simple delay for this runner stub)
  setTimeout(() => {
    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  }, 2000);
}

runTests();
