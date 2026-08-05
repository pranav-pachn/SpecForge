import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function validationCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "validation",
    system: (PromptRegistry as any)['validation'] ? (PromptRegistry as any)['validation']() : '',
    prompt,
    ...args
  });
}

