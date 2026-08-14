import { ModelProfile } from "../interfaces/ModelProfile";
import { providerRegistry } from "./ProviderRegistry";

export class ModelRegistry {
  private models = new Map<string, ModelProfile>();

  /**
   * Refreshes the model registry by polling all available providers.
   */
  refresh() {
    this.models.clear();
    for (const provider of providerRegistry.getAll()) {
      for (const model of provider.getModels()) {
        this.models.set(model.id, model);
      }
    }
  }

  get(id: string): ModelProfile | undefined {
    return this.models.get(id);
  }

  getAll(): ModelProfile[] {
    return Array.from(this.models.values());
  }

  getByTaskProfile(profile: string): ModelProfile[] {
    return this.getAll().filter(m => m.capabilities.includes(profile));
  }
}

export const modelRegistry = new ModelRegistry();
