import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function reviewCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "review",
    system: (PromptRegistry as any)['review'] ? (PromptRegistry as any)['review']() : '',
    prompt,
    ...args
  });
}

