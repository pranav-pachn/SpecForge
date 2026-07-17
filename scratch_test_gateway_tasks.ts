import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { gateway } from './src/lib/ai/gateway/gateway';
import { PromptRegistry } from './src/lib/ai/prompts/registry';

async function test() {
  try {
    console.log('Generating tasks...');
    const result = await gateway.execute({
      capability: "tasks",
      system: PromptRegistry.tasks(),
      prompt: "Decompose this into tasks: Create a dark mode toggle button"
    });
    console.log('Result text length:', result.text.length);
    console.log('Sample:', result.text.substring(0, 100));
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
