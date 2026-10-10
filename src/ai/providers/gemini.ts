import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getRandomKey } from "./utils";

const geminiKey = process.env.GEMINI_API_KEY
  || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  || process.env.GOOGLE_GENERATIVE_AI_API_KEYS;

export const gemini = createGoogleGenerativeAI({
  apiKey: getRandomKey(geminiKey),
});