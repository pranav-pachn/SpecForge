import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function auto_fixCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "auto_fix",
    system: (PromptRegistry as any)['auto_fix'] ? (PromptRegistry as any)['auto_fix']() : '',
    prompt,
    ...args
  });
}

