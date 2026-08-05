import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function clarifyCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "clarify",
    system: (PromptRegistry as any)['clarify'] ? (PromptRegistry as any)['clarify']() : '',
    prompt,
    ...args
  });
}

