import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { gateway } from './src/lib/ai/gateway/gateway';
import { PromptRegistry } from './src/lib/ai/prompts/registry';

async function test() {
  try {
    console.log('Generating...');
    const result = await gateway.execute({
      capability: "planning",
      system: PromptRegistry.plan(),
      prompt: "Test prompt"
    });
    console.log('Result text:', result.text);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
