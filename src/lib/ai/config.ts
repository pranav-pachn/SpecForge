import { openai } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { generateText } from "ai";

export const aiConfig = {
  model: openai("gpt-4o"),
  temperature: 0.2, // Low temperature for more structured, predictable specs
};

export const MODEL_IDS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
  EXECUTION_PACK: 'openai/gpt-4o'
};

const google = createGoogle({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

export async function generateTextWithGemini(modelId: string, options: any) {
  return generateText({
    model: google(modelId),
    ...options
  });
}

export async function generateTextWithOpenRouter(modelId: string, options: any) {
  return generateText({
    model: openai(modelId),
    ...options
  });
}
