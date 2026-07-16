import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function review_gateCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "review_gate",
    system: (PromptRegistry as any)['review_gate'] ? (PromptRegistry as any)['review_gate']() : '',
    prompt,
    ...args
  });
}

