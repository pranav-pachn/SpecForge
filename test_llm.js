require('dotenv').config();
const { generateText } = require('ai');
const { createOpenAI } = require('@ai-sdk/openai');

async function test() {
  const cerebras = createOpenAI({
    apiKey: process.env.CEREBRAS_API_KEY.split(',')[0],
    baseURL: 'https://api.cerebras.ai/v1'
  });
  
  try {
    console.log('Generating...');
    const result = await generateText({
      model: cerebras('zai-glm-4.7'),
      prompt: 'Hello world'
    });
    console.log('Result:', result.text);
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
