import { createMistral } from "@ai-sdk/mistral";
import { getRandomKey } from "./utils";

export const mistral = createMistral({
  apiKey: getRandomKey(process.env.MISTRAL_API_KEY)
});
