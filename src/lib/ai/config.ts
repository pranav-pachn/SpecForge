import { openai } from "@ai-sdk/openai";

export const aiConfig = {
  model: openai("gpt-4o"),
  temperature: 0.2, // Low temperature for more structured, predictable specs
};
