import { AIProvider } from "../interfaces/AIProvider";
import { ModelProfile } from "../interfaces/ModelProfile";

export class ProviderRegistry {
  private providers = new Map<string, AIProvider>();

  register(provider: AIProvider) {
    if (provider.isAvailable()) {
      this.providers.set(provider.id, provider);
      console.log(`[ProviderRegistry] Registered ${provider.id}`);
    } else {
      console.warn(`[ProviderRegistry] Provider ${provider.id} is not available (missing API keys)`);
    }
  }

  get(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }
}

export const providerRegistry = new ProviderRegistry();
