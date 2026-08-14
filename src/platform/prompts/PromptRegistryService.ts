import { PromptBundle, PromptExecutionMetadata } from "./interfaces/PromptBundle";

export class PromptRegistryService {
  private bundleCache = new Map<string, { bundle: PromptBundle; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 1000;

  async getBundle(capability: string, provider: string, model: string): Promise<PromptBundle | null> {
    console.log(`[PromptRegistryService] PromptVariant models removed. Returning null bundle.`);
    return null;
  }

  async createVariant(data: {
    capability: string;
    provider: string;
    model: string;
    systemPrompt: string;
    userTemplate: string;
    executionMetadata: PromptExecutionMetadata;
    parentVersionId?: string;
  }) {
    console.log(`[PromptRegistryService] PromptVariant models removed. Skipping createVariant.`);
    return { id: "mock-variant-id", name: "mock" };
  }

  async activate(variantId: string, reason?: string) {
    console.log(`[PromptRegistryService] PromptVariant models removed. Skipping activate.`);
  }

  async archive(variantId: string) {
    console.log(`[PromptRegistryService] PromptVariant models removed. Skipping archive.`);
  }

  async rollback(capability: string, provider: string, model: string, reason: string) {
    console.log(`[PromptRegistryService] PromptVariant models removed. Skipping rollback.`);
  }
}

export const promptRegistryService = new PromptRegistryService();
