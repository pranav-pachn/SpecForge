import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function driftCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "drift",
    system: (PromptRegistry as any)['drift'] ? (PromptRegistry as any)['drift']() : '',
    prompt,
    ...args
  });
}

