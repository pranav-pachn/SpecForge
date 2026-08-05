import { gateway } from "../gateway/gateway";
import { PromptRegistry } from "../prompts/registry";

export async function tasksCapability(prompt: string, ...args: any[]) {
  return await gateway.execute({
    capability: "tasks",
    system: (PromptRegistry as any)['tasks'] ? (PromptRegistry as any)['tasks']() : '',
    prompt,
    ...args
  });
}

