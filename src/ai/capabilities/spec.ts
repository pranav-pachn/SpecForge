import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function specCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "spec",
    system: (PromptRegistry as any)['spec'] ? (PromptRegistry as any)['spec']() : '',
    prompt,
    ...args
  });
}

