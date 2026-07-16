import { createOpenAI } from "@ai-sdk/openai";
import { getRandomKey } from "./utils";

export const groq = createOpenAI({
  apiKey: getRandomKey(process.env.GROQ_API_KEY),
  baseURL: 'https://api.groq.com/openai/v1'
});
