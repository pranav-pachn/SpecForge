import { Capability } from "./interfaces/Capability";
import { ModelProfile } from "./interfaces/ModelProfile";
import { CapabilityMap } from "./registry/CapabilityMap";
import { modelRegistry } from "./registry/ModelRegistry";
import { providerRegistry } from "./registry/ProviderRegistry";

export class CapabilityRouter {
  
  /**
   * Returns a list of candidate model profiles for a given capability,
   * in order of preference (Primary first, then fallbacks).
   * It filters out models whose underlying providers are not available.
   */
  getCandidates(capability: Capability): ModelProfile[] {
    const route = CapabilityMap[capability];
    if (!route) {
      throw new Error(`Capability ${capability} is not configured in the CapabilityMap.`);
    }

    const candidateIds = [route.primary, ...route.fallbacks];
    const candidates: ModelProfile[] = [];

    for (const modelId of candidateIds) {
      const model = modelRegistry.get(modelId);
      if (model) {
        const provider = providerRegistry.get(model.providerId);
        if (provider && provider.isAvailable()) {
          candidates.push(model);
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error(`No available providers found for capability ${capability}.`);
    }

    return candidates;
  }
}

export const capabilityRouter = new CapabilityRouter();
