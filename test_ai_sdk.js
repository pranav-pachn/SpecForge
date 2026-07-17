require('dotenv').config();
const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const groq = createOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});
async function main() {
  try {
    console.log('Sending request to groq...');
    const result = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: 'You are an expert. Output JSON.',
      prompt: 'Decompose this into tasks: Create a button'
    });
    console.log('Success:', result.text.substring(0, 100));
  } catch(e) {
    console.error('Error:', e);
  }
}
main();
