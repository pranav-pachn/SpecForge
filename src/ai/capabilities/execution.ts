import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function executionCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "execution",
    system: (PromptRegistry as any)['execution'] ? (PromptRegistry as any)['execution']() : '',
    prompt,
    ...args
  });
}

