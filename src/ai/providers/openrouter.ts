import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getRandomKey } from "./utils";

export const openRouter = createOpenRouter({
  apiKey: getRandomKey(process.env.OPENROUTER_API_KEY)
});
