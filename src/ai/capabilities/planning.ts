import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function planningCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "planning",
    system: (PromptRegistry as any)['planning'] ? (PromptRegistry as any)['planning']() : '',
    prompt,
    ...args
  });
}

