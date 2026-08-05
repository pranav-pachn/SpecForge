import { createOpenAI } from "@ai-sdk/openai";
import { getRandomKey } from "./utils";

export const cerebras = createOpenAI({
  apiKey: getRandomKey(process.env.CEREBRAS_API_KEY),
  baseURL: 'https://api.cerebras.ai/v1'
});
