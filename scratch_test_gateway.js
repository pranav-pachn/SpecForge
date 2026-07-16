require('dotenv').config();
const { gateway } = require('./src/lib/ai/gateway/gateway.ts');
const { PromptRegistry } = require('./src/lib/ai/prompts/registry.ts');

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
