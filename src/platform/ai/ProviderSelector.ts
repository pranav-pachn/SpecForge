import { ModelProfile } from "./interfaces/ModelProfile";
import { keyManager } from "./KeyManager";
import { providerRegistry } from "./registry/ProviderRegistry";

export class ProviderSelector {
  
  /**
   * Selects the best available model and provider from a list of candidates.
   * Returns the selected model, provider, and a healthy API key.
   */
  select(candidates: ModelProfile[]): { model: ModelProfile, providerId: string, apiKey: string } {
    for (const model of candidates) {
      const provider = providerRegistry.get(model.providerId);
      if (provider && provider.isAvailable()) {
        const apiKey = keyManager.getHealthyKey(model.providerId);
        if (apiKey) {
          return { model, providerId: model.providerId, apiKey };
        }
      }
    }

    throw new Error("No healthy provider/key combination found among candidate models.");
  }
}

export const providerSelector = new ProviderSelector();
